var nodeModuleCache = require("../");
var fs = require('fs');

nodeModuleCache.start();

var testModule = require("./test-module");

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

var express = require('express')();

nodeModuleCache.saveCache();

process.send({
  statSyncCount: statSyncCount,
  readFileSyncCount: readFileSyncCount
});