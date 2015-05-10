var start = process.hrtime();
var nodeModuleCache = require("../");
var fs = require('fs');

var version = "0.0.1";
if (process.argv.length > 2)
  version = process.argv[2];

nodeModuleCache.start({cacheKiller: version});

var orig = {};

orig.statSync = fs.statSync;
var statSyncCount = 0;
fs.statSync = function(path) {
  statSyncCount++;
  return orig.statSync(path);
};

orig.readFileSync = fs.readFileSync;
var readFileSyncCount = 0;
fs.readFileSync = function(path, opts) {
  readFileSyncCount++;
  return orig.readFileSync(path, opts);
};

orig.existsSync = fs.existsSync;
var existsSyncCount = 0;
fs.existsSync = function(path) {
  existsSyncCount++;
  return orig.existsSync(path);
};


var testModule = require("./test-module");
var express = require('express')();

nodeModuleCache.saveCache();

process.send({
  statSyncCount: statSyncCount,
  readFileSyncCount: readFileSyncCount,
  existsSyncCount: existsSyncCount,
  loadingTime: process.hrtime(start)
});