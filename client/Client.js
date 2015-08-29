var fs = require("fs");
var path = require("path");

require("./ParsedURL.js");
require("./SourceMap.js");

/**
 * @constructor
 * @implements {SMEditor.EditableSourceMap}
 * @param {!WebInspector.SourceMap} sourceMap
 */
WebInspector.EditableSourceMap = function(provider, sourceMapURL)
{
    var payload = JSON.parse(provider.sourceForURL(sourceMapURL));
    this._sourceMap = new WebInspector.SourceMap(sourceMapURL, payload);
    this._origin = payload.file;
}

WebInspector.EditableSourceMap.prototype = {
    /**
     * @return {string}
     */
    originURL: function()
    {
        return this._origin;
    },

    /**
     * @param {!SMEditor.TextRange} oldRange
     * @param {!SMEditor.TextRange} newRange
     * @return {boolean}
     */
    editOrigin: function(oldRange, newRange)
    {
        return this._sourceMap.compiledRangeEdited(oldRange, newRange);
    },

    /**
     * @param {number} lineNumber
     * @param {number} columnNumber
     * @return {?SMEditor.SourceMapEntry}
     */
    findEntry: function(lineNumber, columnNumber)
    {
        var entry = this._sourceMap.findEntry(lineNumber, columnNumber);
        if (!entry)
            return null;
        return new SMEditor.SourceMapEntry(entry[0], entry[1], entry[2], entry[3], entry[4]);
    },

    /**
     * @param {string} sourceURL
     * @param {number} lineNumber
     * @param {number} columnNumber
     * @return {?Array.<!SMEditor.SourceMapEntry>}
     */
    findEntryReversed: function(sourceURL, lineNumber, columnNumber)
    {
        throw "Not Implemented";
    }
}

/**
 * @constructor
 * @implements {SMEditor.SourceProvider}
 * @param {string} directory
 */
WebInspector.SourceProvider = function(directory)
{
    this._directory = directory;
}

WebInspector.SourceProvider = {
    /**
     * @param {string} sourceURL
     * @return {?string}
     */
    sourceForURL: function(sourceURL)
    {
        return fs.readFileSynt(path.join(this._directory, sourceURL), "utf-8");
    },

    /**
     * @param {string} sourceURL
     * @return {?boolean}
     */
    hasSourceForURL: function(sourceURL)
    {
        try {
            fs.lstatSync(path.join(this._directory, sourceUrl));
        } catch (e) {
            return false;
        }
    }
}

