SMEditor = {
    /**
     * @param {string} sourceURL
     * @param {string} contentV1
     * @param {string} contentV2
     * @return {!Array.<!SMEditor.Edit>}
     */
    computeEditDiff: function(sourceURL, contentV1, contentV2)
    {
        var differ = new diff_match_patch();
        var diff = differ.diff_main(contentV1, contentV2);
        differ.diff_cleanupEfficiency(diff);
        var sourceOffset = 0;
        var edits = [];
        var i = 0;
        while (i < diff.length) {
            var token = diff[i];
            if (token[0] === 0) {
                sourceOffset += token[1].length;
                ++i;
                continue;
            }

            var nextToken = diff[i + 1];
            if (nextToken && nextToken[0] === -token[0]) {
                // If this is an EDIT command.
                var add, remove;
                if (token[0] === 1) {
                    add = token;
                    remove = nextToken;
                } else {
                    add = nextToken;
                    remove = token;
                }
                var sourceRange = new WebInspector.SourceRange(sourceOffset, remove[1].length);
                var oldRange = WebInspector.TextRange.createFromSourceRange(contentV1, sourceRange);
                edits.push(new SMEditor.Edit(sourceURL, oldRange, remove[1], add[1]));
                sourceOffset += add[1].length;
                i += 2;
            } else if (token[0] === 1) {
                // If this is an ADD command.
                var sourceRange = new WebInspector.SourceRange(sourceOffset, 0);
                var oldRange = WebInspector.TextRange.createFromSourceRange(contentV1, sourceRange);
                edits.push(new SMEditor.Edit(sourceURL, oldRange, "", token[1]));
                sourceOffset += token[1].length;
                i += 1;
            } else {
                // If this is a REMOVE command.
                var sourceRange = new WebInspector.SourceRange(sourceOffset, token[1].length);
                var oldRange = WebInspector.TextRange.createFromSourceRange(contentV1, sourceRange);
                edits.push(new SMEditor.Edit(sourceURL, oldRange, token[1], ""));
                i += 1;
            }
        }
        return edits;
    },

    /**
     * @param {!SMEditor.SourceProvider} provider
     * @param {!SMEditor.EditableSourceMap} map
     * @param {!SMEditor.Edit} edit
     * @return {!Promise.<!Array.<!SMEditor.Edit>>}
     */
    doEdit: function(provider, map, edit)
    {
        if (map.originURL() === edit.sourceURL)
            return SMEditor._doEditOrigin(provider, map, edit);
        if (provider.hasSourceForURL(edit.sourceURL))
            return SMEditor._doEditDestination(provider, map, edit);
    },

    /**
     * @param {!SMEditor.SourceProvider} provider
     * @param {!SMEditor.EditableSourceMap} map
     * @param {!SMEditor.Edit} edit
     * @return {!Promise.<!Array.<!SMEditor.Edit>>}
     */
    _doEditOrigin: function(provider, map, edit)
    {
        var entry = map.findEntry(edit.oldRange.startLine, edit.oldRange.startColumn);
        var endEntry = map.findEntry(edit.oldRange.endLine, edit.oldRange.endColumn);
        // Return if start and end are not inside the same mapped segment.
        if (!entry.equals(endEntry))
            return Promise.reject(new Error("This edit will damage mapping."));

        return provider.sourceForURL(entry.sourceURL).then(onSourceLoaded.bind(SMEditor));

        /**
         * @param {?string} source
         * @return {!Promise.<!Array.<!SMEditor.Edit>>}
         */
        function onSourceLoaded(source)
        {
            // Return if we don't have source for mapped entries.
            if (!source)
                throw new Error("Source of %s is missing", entry.sourceURL);

            var destOldRange = SMEditor._destinationRange(entry, edit.oldRange);
            var destOldText = destOldRange.extract(source);
            // If the text in compiled and original differs, then we cannot edit it.
            if (edit.oldText !== destOldText)
                throw new Error("The edited range is not equal in origin and source");

            var newTextLineCount = edit.newText.lineEndings().length;
            if (newTextLineCount > 1)
                throw new Error("Not implemented for multi-line edit");

            var originNewRange = new WebInspector.TextRange(
                    edit.oldRange.startLine,
                    edit.oldRange.startColumn,
                    edit.oldRange.startLine,
                    edit.oldRange.startColumn + edit.newText.length);

            if (!map.editOrigin(edit.oldRange, originNewRange))
                throw new Error("Failed to update source map.");

            return [ new SMEditor.Edit(entry.sourceURL, destOldRange, destOldText, edit.newText) ];
        }
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
     * @return {!Promise.<!Array.<!SMEditor.Edit>>}
     */
    _doEditDestination: function(provider, map, edit)
    {
        return Promise.reject(new Error("Not Implemented."));
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
     * @param {string} sourceURL
     * @param {number} lineNumber
     * @param {number} columnNumber
     * @return {?Array.<!SMEditor.SourceMapEntry>}
     */
    findEntryReversed: function(sourceURL, lineNumber, columnNumber) { }
}

/**
 * @interface
 */
SMEditor.SourceProvider = function() { }

SMEditor.SourceProvider.prototype = {
    /**
     * @param {string} sourceURL
     * @return {!Promise.<?string>}
     */
    sourceForURL: function(sourceURL) { return null; },

    /**
     * @param {string} sourceURL
     * @return {?boolean}
     */
    hasSourceForURL: function(sourceURL) { return false; }
}

