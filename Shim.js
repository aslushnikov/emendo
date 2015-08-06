// The SourceMap depends on WebInspector object.
self = this;
WebInspector = {},
require("./utilities.js");
require("./ParsedURL.js");
require("./SourceMap.js");

var fs = require("fs");

fs.readFile("all.css.map", "utf-8", function(error, text) {
    if (error || !text) {
        console.error("Failed to load sourceMap.");
        return;
    }
    var payload = JSON.parse(text);
    var sourceMap = new WebInspector.SourceMap("all.css.map", payload);
    console.log(sourceMap.findEntry(0, 0));
    console.log(sourceMap.findEntry(0, 1));
    console.log(sourceMap.findEntry(0, 2));
    console.log(sourceMap.findEntry(0, 3));
    console.log(sourceMap.findEntry(0, 4));
});
