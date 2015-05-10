var Module = require('module')
  , fs = require('fs');

var _resolveFilename = Module._resolveFilename;
var DEFAULT_CACHE_FILE = './node_modules/module-locations-cache.json';
var options = {
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

function loadCache() {
  try {
    if (fs.existsSync(options.cacheFile)) {
      var readFileNameLookup = JSON.parse(fs.readFileSync(options.cacheFile, 'utf-8'));
      if ((!options.cacheKiller) || (readFileNameLookup._cacheKiller === options.cacheKiller))
        filenameLookup = readFileNameLookup;
    }
  } catch (e) {
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
  loadCache();
}

function stop() {
  Module._resolveFilename = _resolveFilename;
  saveCache();
}

function saveCache() {
  fs.writeFileSync(options.cacheFile, JSON.stringify(filenameLookup));
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

module.exports.loadCache = loadCache;
module.exports.start = start;
module.exports.stop = stop;
module.exports.saveCache = saveCache;
module.exports.DEFAULT_CACHE_FILE = DEFAULT_CACHE_FILE;
