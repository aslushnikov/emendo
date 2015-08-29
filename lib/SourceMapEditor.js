var SMEditor = {
    /**
     * @param {!SMEditor.SourceProvider} provider
     * @param {!SMEditor.EditableSourceMap} map
     * @param {!SMEditor.Edit} edit
     * @return {!Array.<!SMEditor.Edit>}
     */
    doEdit: function(provider, map, edit)
    {
        if (map.originUrl() === edit.sourceURL)
            return this._doEditOrigin(provider, map, edit);
        if (provider.hasSourceForURL(edit.sourceURL))
            return this._doEditDestination(provider, map, edit);
    },

    /**
     * @param {!SMEditor.SourceProvider} provider
     * @param {!SMEditor.EditableSourceMap} map
     * @param {!SMEditor.Edit} edit
     * @return {!Array.<!SMEditor.Edit>}
     */
    _doEditOrigin: function(provider, map, edit)
    {
        var entry = map.findEntry(edit.oldRange.startLine, edit.oldRange.startColumn);
        var endEntry = map.findEntry(edit.oldRange.endLine, edit.oldRange.endColumn);
        // Return if start and end are not inside the same mapped segment.
        if (!entry.equals(endEntry)) {
            console.error("This edit will damage mapping.");
            return [];
        }
        var source = provider.sourceForURL(entry.sourceURL);
        // Return if we don't have source for mapped entries.
        if (!source) {
            console.error("Source of %s is missing", entry.sourceURL);
            return [];
        }

        var destOldRange = this._destinationRange(entry, range);
        var destOldText = destOldRange.extract(source);
        // If the text in compiled and original differs, then we cannot edit it.
        if (edit.oldText !== destOldText) {
            console.error("The edited range is not equal in origin and source");
            return [];
        }

        var newTextLineCount = edit.newText.lineEndings().length;
        if (newTextLineCount > 1) {
            throw "Not implemented for multi-line edit";
        }
        var destNewRange = new WebInspector.TextRange(
                destOldRange.startLine,
                destOldRange.startColumn,
                destOldRange.startLine,
                edit.oldRange.startColumn + edit.newText.length);

        if (!map.editOrigin(edit.oldRange, destNewRange)) {
            console.error("Failed to update source map.");
            return [];
        }

        return [ new SMEditor.Edit(entry.sourceURL, destOldRange, destOldText, edit.newText) ];
    },

    /**
     * @param {!SMEditor.SourceMapEntry} entry
     * @param {!SMEditor.TextRange} originRange
     */
    _destinationRange: function(entry, originRange)
    {
        var startLine = entry.sourceLine + originRange.startLine - entry.originLine;
        var startColumn = entry.sourceColumn + originRange.startColumn - entry.originColumn;
        var endLine = entry.sourceLine + originRange.endLine - entry.originLine;
        var endColumn = entry.sourceColumn + originRange.endColumn - entry.originColumn;
        return new WebInspector.TextRange(startLine, startColumn, endLine, endColumn);
    },

    /**
     * @param {!SMEditor.SourceProvider} provider
     * @param {!SMEditor.EditableSourceMap} map
     * @param {!SMEditor.Edit} edit
     * @return {!Array.<!SMEditor.Edit>}
     */
    _doEditDestination: function(provider, map, edit)
    {
        throw "Not Implemented.";
    }
}

/**
 * @constructor
 * @param {string} sourceURL
 * @param {!SMEditor.TextRange} oldRange
 * @param {string} oldText
 * @param {string} newText
 */
SMEditor.Edit = function(sourceURL, oldRange, oldText, newText)
{
    this.sourceURL = sourceURL;
    this.oldRange = oldRange;
    this.oldText = oldText;
    this.newText = newText;
}

SMEditor.TextRange = WebInspector.TextRange;

/**
 * @constructor
 * @param {number} originLine
 * @param {number} originColumn
 * @param {string} sourceURL
 * @param {number} sourceLine
 * @param {number} sourceColumn
 */
SMEditor.SourceMapEntry = function(originLine, originColumn, sourceURL, sourceLine, sourceColumn)
{
    this.originLine = originLine;
    this.originColumn = originColumn;
    this.sourceURL = sourceURL;
    this.sourceLine = sourceLine;
    this.sourceColumn = sourceColumn;
}

SMEditor.SourceMapEntry.prototype = {
    /**
     * @param {!SMEditor.SourceMapEntry} other
     * @return {boolean}
     */
    equals: function(other)
    {
        return this.originLine === other.originLine &&
            this.originColumn === other.originColumn &&
            this.sourceURL === other.sourceURL &&
            this.sourceLine === other.sourceLine &&
            this.sourceColumn === other.sourceColumn;
    }
}

/**
 * @interface
 */
SMEditor.EditableSourceMap = function() { }

SMEditor.EditableSourceMap.prototype = {
    /**
     * @return {string}
     */
    originURL: function() { },

    /**
     * @param {!SMEditor.TextRange} oldRange
     * @param {!SMEditor.TextRange} newRange
     * @return {boolean}
     */
    editOrigin: function(oldRange, newRange) { },

    /**
     * @param {number} lineNumber
     * @param {number} columnNumber
     * @return {?SMEditor.SourceMapEntry}
     */
    findEntry: function(lineNumber, columnNumber) { },

    /**
     * @param {number} lineNumber
     * @param {number} columnNumber
     * @return {?Array.<!SMEditor.SourceMapEntry>}
     */
    findEntryReversed: function(lineNumber, columnNumber) { }
}

/**
 * @interface
 */
SMEditor.SourceProvider = function() { }

SMEditor.SourceProvider.prototype = {
    /**
     * @param {string} sourceURL
     * @return {?string}
     */
    sourceForURL: function(sourceURL) { return null; },

    /**
     * @param {string} sourceURL
     * @return {?boolean}
     */
    hasSourceForURL: function(sourceURL) { return false; }
}
