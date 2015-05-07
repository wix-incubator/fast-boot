"use strict";
var chai = require('chai');
var expect = chai.expect;
var fs = require('fs');
var childProcess = require('child_process');
var nodeModuleCache = require("../");

describe("node-module-location-cache", function () {

  beforeEach(function () {
    try {
    fs.unlinkSync(nodeModuleCache.DEFAULT_CACHE_FILE);
    }
    catch (e) {}
  });

  it("should not prevent loading NPM modules", function(done) {
    var child = childProcess.fork("./test/test-app.js");
    child.on("message", function(data) {
      expect(data.statSyncCount).to.be.above(100);
      expect(data.readFileSyncCount).to.be.above(100);
      console.log(data);

      var moduleLocationsCache = loadModuleLocationsCache();
      expect(moduleLocationsCache).to.satisfy(noNonNodeModulesPaths);
      done();
    })
  });

  it("should not search for files again on second invocation of node", function(done) {
    var child = childProcess.fork("./test/test-app.js");
    child.on("message", function(data) {

      var child2 = childProcess.fork("./test/test-app.js");
      child2.on("message", function(data2) {
        expect(data.statSyncCount).to.be.above(data2.statSyncCount);
        expect(data.readFileSyncCount).to.be.above(data2.readFileSyncCount);
        console.log(data);
        console.log(data2);

        var moduleLocationsCache = loadModuleLocationsCache();
        expect(moduleLocationsCache).to.satisfy(noNonNodeModulesPaths);
        done();
      })
    })
  });

});

function loadModuleLocationsCache() {
  var content = fs.readFileSync(nodeModuleCache.DEFAULT_CACHE_FILE);
  return JSON.parse(content);
}

function noNonNodeModulesPaths(moduleLocationsCache) {
  var keys = Object.keys(moduleLocationsCache);
  for (var index in keys) {
    var key = keys[index];
    if (moduleLocationsCache[key] && moduleLocationsCache[key].indexOf("node_modules") == -1)
      return false;
  }
  return true;
}
