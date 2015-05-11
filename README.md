[![NPM version](https://img.shields.io/npm/v/fast-boot.svg)](https://www.npmjs.com/package/fast-boot)

# fast-boot
Caching of the FS location of node modules between node process startups

The module hooks into the node module module and changes the ```_resolveFilename``` method, caching the files it finds
in order to improve node loading performance. Node does tons of file lookups as it resolves modules and by default
it does not cache the found file locations.

node-module-location-cache caches only location of files in the ```node_modules``` directory.

by default, node-module-location-cache will save the modules locations cache under node_modules 10 seconds after
a module was loaded. You can also force it to save the cache or load the cache using the API methods

# Reference:

## nodeModuleCache.start([opts])


Starts the caching

```
var nodeModuleCache = require("fast-boot");
nodeModuleCache.start(opts);
```

Start accepts an options parameter with two options
   * ```cacheFile``` - alternate cache file location. Defaults to ```{os.tmpdir()}/module-locations-cache.json```
   * ```startupFile``` - alternate startup file location. Defaults to ```./node_modules/module-locations-cache.json```, relative to the ```process.cwd()```
   * ```cacheKiller``` - used to invalidate the cache. Normally one will pass the application version number assuming that a different version
   may have different version of dependencies making modules located in different locations. The default is the version number from package.json,
   if one exists

## nodeModuleCache.stop()

stops the module

```
nodeModuleCache.stop();
```

## nodeModuleCache.saveCache()

saves the cache file

```
nodeModuleCache.saveCache();
```

## nodeModuleCache.saveStartupList()

saves the startup file

```
nodeModuleCache.saveStartupList();
```

## nodeModuleCache.loadModuleList()

reloads the modules list from the cache file (if exists) or the startup file (if exists)

```
nodeModuleCache.loadModuleList();
```

## nodeModuleCache.stats()

returns a statistics object about the caching effectiveness. The stats object include the following members

* cacheHit - the number of modules who's locations were found in the cache
* cacheMiss - the number of modules who's locations were not found in the cache - and were added to the cache file
* notCached - the number of modules not to be cached - either not in a node_modules folder or not under process.cwd()
* cacheKiller - the current value of the cache killer

```
var stats = nodeModuleCache.stats();
console.log(stats.cacheHit);
console.log(stats.cacheMiss);
console.log(stats.notCached);
```
