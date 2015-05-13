var Module = require('module')
  , fs = require('fs')
  , os = require('os')
  , path = require('path');

var _resolveFilename = Module._resolveFilename;
var DEFAULT_STARTUP_FILE = path.normalize('./node_modules/module-locations-startup.json');
var DEFAULT_CACHE_FILE = path.join(os.tmpdir(), 'module-locations-cache.json') ;
var options = {
  startupFile: DEFAULT_STARTUP_FILE,
  cacheFile: DEFAULT_CACHE_FILE,
  cacheKiller: versionNumber()
};
var filenameLookup = newFilenameLookup();
var cwd = process.cwd();
var stats = {
  cacheHit: 0,
  cacheMiss: 0,
  notCached: 0
};

function toCanonicalPath(filename) {
  var relative = path.relative(cwd, filename);
  // do not cache files outside of the process.cwd() scope
  if (relative.indexOf("..") == 0)
    return undefined;

  return relative.replace("\\\\", "/")
}

function toAbsolutePath(filename) {
  return path.join(cwd, filename);
}

function resolveFilenameOptimized(request, parent) {
  var key = (toCanonicalPath(parent.id) + ":" + request );
  var canonical = filenameLookup[key];
  var filename = undefined;
  if (canonical)
    filename = toAbsolutePath(canonical);

  if (filename && fs.existsSync(filename)) {
    stats.cacheHit++;
    return filename;
  }
  else {
    filename = _resolveFilename.apply(Module, arguments);
    canonical = toCanonicalPath(filename);
    if (canonical && canonical.indexOf("node_modules") > -1) {
      filenameLookup[key] = canonical;
      scheduleSaveCache();
      stats.cacheMiss++;
    }
    else {
      stats.notCached++;
    }
    return filename;
  }
}

function loadModuleList() {

  function tryLoadingFile(file) {
    if (fs.existsSync(file)) {
      var readFileNameLookup = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if ((!options.cacheKiller) || (readFileNameLookup._cacheKiller === options.cacheKiller))
        filenameLookup = readFileNameLookup;
      return true;
    }
    return false;
  }

  try {
    tryLoadingFile(options.cacheFile) || tryLoadingFile(options.startupFile);
  }
  catch (e) {
    filenameLookup = newFilenameLookup();
  }
}

function start(opts) {
  if (opts) {
    if (opts.cacheFile)
      options.cacheFile = opts.cacheFile;
    if (opts.startupFile)
      options.startupFile = opts.startupFile;
    if (opts.cacheKiller) {
      options.cacheKiller = opts.cacheKiller;
      filenameLookup._cacheKiller = options.cacheKiller;
    }
  }
  Module._resolveFilename = resolveFilenameOptimized;
  loadModuleList();
}

function stop() {
  Module._resolveFilename = _resolveFilename;
  saveCache();
}

function saveCache(cb) {
  fs.writeFile(options.cacheFile, JSON.stringify(filenameLookup), onSaveError(cb));
  clearSaveCacheTimer();
}

function saveStartupList(cb) {
  fs.writeFile(options.startupFile, JSON.stringify(filenameLookup), onSaveError(cb));
}

function onSaveError(other) {
  return function handleSaveError(err) {
    if (err)
      console.log('Error:', err, err.stack);

    console.log('Cache file saved successfully.');

    if (other)
      other(err);
  }
}

var saveCacheTimer;
function clearSaveCacheTimer() {
  if (saveCacheTimer) {
    clearTimeout(saveCacheTimer);
    saveCacheTimer = null;
  }
}
function scheduleSaveCache() {
  clearSaveCacheTimer();
  saveCacheTimer = setTimeout(saveCache, 10*1000);
}

function versionNumber() {
  try {
    return require('./package.json').version.toString();
  }
  catch (e) {
    return undefined;
  }
}

function newFilenameLookup() {
  return {_cacheKiller: options.cacheKiller}
}

module.exports.loadModuleList = loadModuleList;
module.exports.start = start;
module.exports.stop = stop;
module.exports.saveCache = saveCache;
module.exports.saveStartupList = saveStartupList;
module.exports.DEFAULT_CACHE_FILE = DEFAULT_CACHE_FILE;
module.exports.DEFAULT_STARTUP_FILE = DEFAULT_STARTUP_FILE;
module.exports.stats = function () {
  return {
    cacheHit: stats.cacheHit,
    cacheMiss: stats.cacheMiss,
    notCached: stats.notCached,
    cacheKiller: filenameLookup._cacheKiller
  }
}