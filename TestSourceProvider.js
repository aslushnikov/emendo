var fs = require("fs");
var path = require("path");

/**
 * @constructor
 * @implements {SMEditor.SourceProvider}
 * @param {string} directory
 */
var TestSourceProvider = function(directory)
{
    this._directory = directory;
    this._map = new Map();
}

TestSourceProvider.prototype = {
    reset: function()
    {
        this._map = new Map();
    },

    /**
     * @param {string} sourceURL
     * @param {string} content
     */
    setSourceForURL: function(sourceURL, content)
    {
        var full = path.join(this._directory, sourceURL);
        this._map.set(full, content);
    },

    /**
     * @param {string} sourceURL
     * @return {!Promise.<?string>}
     */
    sourceForURL: function(sourceURL)
    {
        var full = path.join(this._directory, sourceURL);
        if (!this._map.has(full))
            this._map.set(full, fs.readFileSync(full, "utf-8"));
        return Promise.resolve(this._map.get(full));
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

module.exports = TestSourceProvider;
