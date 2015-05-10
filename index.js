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

function resolveFilenameOptimized(request, parent) {
  var key = (request + ':' + parent.id);
  var filename = filenameLookup[key];
  if (filename && fs.existsSync(filename)) {
    return filename;
  }
  else {
    filename = _resolveFilename.apply(Module, arguments);
    if (filename.indexOf("node_modules") > -1) {
      filenameLookup[key] = filename;
      scheduleSaveCache();
      return filename;
    }
    return filename;
  }
}

function loadModuleList() {
  try {
    if (fs.existsSync(options.cacheFile)) {
      var readFileNameLookup = JSON.parse(fs.readFileSync(options.cacheFile, 'utf-8'));
      if ((!options.cacheKiller) || (readFileNameLookup._cacheKiller === options.cacheKiller))
        filenameLookup = readFileNameLookup;
    }
    else if (fs.existsSync(options.startupFile)) {
      var readFileNameLookup = JSON.parse(fs.readFileSync(options.startupFile, 'utf-8'));
      if ((!options.cacheKiller) || (readFileNameLookup._cacheKiller === options.cacheKiller))
        filenameLookup = readFileNameLookup;
    }
  }
  catch (e) {
    console.log(e);
    filenameLookup = newFilenameLookup();
  }
}

function start(opts) {
  if (opts) {
    if (opts.cacheFile)
      options.cacheFile = opts.cacheFile;
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

function saveCache() {
  fs.writeFileSync(options.cacheFile, JSON.stringify(filenameLookup));
  clearSaveCacheTimer();
}

function saveStartupList() {
  fs.writeFileSync(options.startupFile, JSON.stringify(filenameLookup));
  clearSaveCacheTimer();
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
