fs = require('fs');

// The SourceMap depends on WebInspector object.
WebInspector = {};
require("./utilities.js");
require("./ParsedURL.js");
require("./TextRange.js");
require("./SourceMap.js");

var mapURL = "res/all.css.map";
fs.readFile(mapURL, "utf-8", function(error, text) {
    if (error || !text) {
        console.error("Failed to load sourceMap.");
        return;
    }
    var payload = /** @type {!SourceMapV3} */(JSON.parse(/** @type {string} */(text)));
    var sourceMap = new WebInspector.SourceMap(mapURL, payload);
    var sourceNames = sourceMap.sources();
    var sources = [];
    var file = fs.readFileSync("res/" + payload.file, "utf-8");
    for (var sourceName of sourceNames) {
        sources.push(fs.readFileSync(sourceName, "utf-8"));
    }
    console.log(sourceMap.findEntry(0, 0));
    console.log(sourceMap.findEntry(0, 1));
    console.log(sourceMap.findEntry(0, 2));
    console.log(sourceMap.findEntry(0, 3));
    console.log(sourceMap.findEntry(0, 4));
    console.log(sourceMap.sources());
});

