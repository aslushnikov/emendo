require("./ParsedURL.js");
require("./SourceMap.js");

/**
 * @constructor
 * @implements {SMEditor.EditableSourceMap}
 * @param {!WebInspector.SourceMap} sourceMap
 */
WebInspector.EditableSourceMap = function(payload, sourceMapURL)
{
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
     * @param {!SMEditor.TextRange} destOldRange
     * @return {boolean}
     */
    editOrigin: function(oldRange, newRange, destOldRange)
    {
        return this._sourceMap.compiledRangeEdited(oldRange, newRange, destOldRange);
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

