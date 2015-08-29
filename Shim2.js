require("./lib/utilities.js");

WebInspector = {};
require("./lib/TextRange.js");
require("./lib/SourceMapEditor.js");

require("./client/Client.js");

var provider = new WebInspector.SourceProvider("res");
var mapURL = "all.css.map";
var sourceMap = new WebInspector.EditableSourceMap(provider, "all.css.map");

function createOriginEdit(provider, map, oldRange, newText) {
    var content = provider.sourceForURL(map.origin());
    var oldText = oldRange.extract(content);
    return new SMEditor.Edit(map.origin(), oldRange, oldText, newText);
}

function editedText(provider, edit) {
    var content = provider.sourceForURL(edit.sourceURL);
    return edit.oldRange.replaceInText(content, edit.newText);
}
