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
    console.log("Entry example:");
    console.log(sourceMap.findEntry(0, 2));
    console.log("Can edit range: " + canEditCompiled(compiled, sourceMap, sources, new WebInspector.TextRange(0, 4, 0, 6)));
    var result = editCompiled(compiled, sourceMap, sources, new WebInspector.TextRange(0, 4, 0, 6), "bitch");
    editCompiled(result.compiled, result.map, result.sources, new WebInspector.TextRange(0, 62, 0, 64), "40");
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
    var entry = map.findEntry(range.startLine, range.startColumn);
    var endEntry = map.findEntry(range.endLine, range.endColumn);
    // Return if start and end are not inside mapped segment.
    if (entry !== endEntry)
        return false;
    var source = sources.get(entry[2]);
    // Return if we don't have source for mapped entries.
    if (!source)
        return false;
    var mappedRange = new WebInspector.TextRange(entry[3] + range.startLine - entry[0], entry[4] + range.startColumn - entry[1], entry[3] + range.endLine - entry[0], entry[4] + range.endColumn - entry[1]);
    var compiledText = extractSubstring(compiled, range);
    var sourceText = extractSubstring(source, mappedRange);
    //console.log("Compiled: %s", compiledText);
    //console.log("Source: %s", sourceText);
    return compiledText === sourceText;
}

function editCompiled(compiled, map, sources, range, newText) {
    var entry = map.findEntry(range.startLine, range.startColumn);
    var endEntry = map.findEntry(range.endLine, range.endColumn);
    // Return if start and end are not inside mapped segment.
    if (entry !== endEntry)
        return null;
    var source = sources.get(entry[2]);
    // Return if we don't have source for mapped entries.
    if (!source)
        return null;
    var mappedRange = new WebInspector.TextRange(entry[3] + range.startLine - entry[0], entry[4] + range.startColumn - entry[1], entry[3] + range.endLine - entry[0], entry[4] + range.endColumn - entry[1]);
    var compiledText = extractSubstring(compiled, range);
    var sourceText = extractSubstring(source, mappedRange);
    if (compiledText !== sourceText)
        return null;
    var newCompiled = range.replaceInText(compiled, newText);
    var newSource = mappedRange.replaceInText(source, newText);

    console.log("## Compiled ##\n%s\n------", newCompiled);
    console.log("## Source ##\n%s\n------", newSource);

    var endColumn = newText.lineEndings().length > 1 ? newText.length : range.startColumn + newText.length;
    var newTextRange = new WebInspector.TextRange(range.startLine, range.startColumn, range.startLine + newText.lineEndings().length - 1, endColumn);
    if (!map.compiledRangeEdited(range, newTextRange)) {
        console.error("Failed to update source map.");
        return null;
    }

    var newSources = new Map(sources);
    newSources.set(entry[0], newSource);
    return {
        compiled: newCompiled,
        map: map,
        sources: newSources
    };
}

