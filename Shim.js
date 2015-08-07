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
    var sources = new Map();
    var compiled = fs.readFileSync("res/" + payload.file, "utf-8");
    for (var sourceName of sourceNames) {
        sources.set(sourceName, fs.readFileSync(sourceName, "utf-8"));
    }
    console.log(sourceMap.findEntry(0, 2));
    canEditCompiled(compiled, sourceMap, sources, new WebInspector.TextRange(0, 4, 0, 6));
});

/**
 * @param {string} text
 * @param {!WebInspector.TextRange} range
 * @return {string}
 */
function extractSubstring(text, range) {
    var sourceRange = range.toSourceRange(text);
    return text.substr(sourceRange.offset, sourceRange.length);
}

/**
 * @param {string} compiled
 * @param {!WebInspector.SourceMap} map
 * @param {!Map.<string, string>} sources
 * @param {!WebInspector.TextRange} range
 * @return {boolean}
 */
function canEditCompiled(compiled, map, sources, range) {
    var startEntry = map.findEntry(range.startLine, range.startColumn);
    var endEntry = map.findEntry(range.endLine, range.endColumn);
    // Return if start and end are mapped to different source files.
    if (startEntry[2] !== endEntry[2])
        return false;
    var source = sources.get(startEntry[2]);
    // Return if we don't have source for mapped entries.
    if (!source)
        return false;
    var mappedRange = new WebInspector.TextRange(startEntry[3], startEntry[4] + range.startColumn - startEntry[1], endEntry[3], endEntry[4] + range.endColumn - endEntry[1]);
    var compiledText = extractSubstring(compiled, range);
    var sourceText = extractSubstring(source, mappedRange);
    return compiledText === sourceText;
}

