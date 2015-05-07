var Module = require('module')
  , fs = require('fs');

var filenameLookup = {};
var _resolveFilename = Module._resolveFilename;
var DEFAULT_CACHE_FILE = './node_modules/module-locations-cache.json';
var options = {
  cacheFile: DEFAULT_CACHE_FILE,
  optimistic: true
};

function resolveFilenameOptimized(request, parent) {
  var key = (request + ':' + parent.id);
  var filename = filenameLookup[key];
  if ((options.optimistic && filename) ||
    (!options.optimistic && fs.existsSync(filename))) {
    return filename;
  }
  else {
    filename = _resolveFilename.apply(Module, arguments);
    if (filename.indexOf("node_modules") > -1) {
      (filenameLookup[key] = _resolveFilename.apply(Module, arguments));
      scheduleSaveCache();
    }
    return filename;
  }
}

function loadCache() {
  try {
    if (fs.existsSync(options.cacheFile))
      filenameLookup = JSON.parse(fs.readFileSync(options.cacheFile, 'utf-8'));
  } catch (e) {
    console.log(e);
    filenameLookup = {};
  }
}

function start(opts) {
  if (opts) {
    if (opts.cacheFile)
      options.cacheFile = opts.cacheFile;
    if (opts.checkModuleFileExistance)
      options.optimistic = false;
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

module.exports.loadCache = loadCache;
module.exports.start = start;
module.exports.stop = stop;
module.exports.saveCache = saveCache;
module.exports.DEFAULT_CACHE_FILE = DEFAULT_CACHE_FILE;
