
WebInspector = {};
require("./lib/utilities.js");
require("./lib/TextRange.js");
require("./lib/SourceMapEditor.js");
require("./client/Client.js");

var TestSourceProvider = require("./TestSourceProvider");

var provider = new TestSourceProvider("res");
var mapURL = "all.css.map";
var map = new WebInspector.EditableSourceMap(provider, "all.css.map");

test(provider, map, new WebInspector.TextRange(0, 4, 0, 6), "bitch");
test(provider, map, new WebInspector.TextRange(0, 62, 0, 64), "40");

function createOriginEdit(provider, map, oldRange, newText) {
    var content = provider.sourceForURL(map.originURL());
    var oldText = oldRange.extract(content);
    return new SMEditor.Edit(map.originURL(), oldRange, oldText, newText);
}

function updateText(provider, edit) {
    var content = provider.sourceForURL(edit.sourceURL);
    content = edit.oldRange.replaceInText(content, edit.newText);
    provider.setSourceForURL(edit.sourceURL, content);
    console.log("==== %s\n%s\n", edit.sourceURL, content);
}

function test(provider, map, range, text) {
    var edit = createOriginEdit(provider, map, range, text);
    var results = SMEditor.doEdit(provider, map, edit);
    console.log(JSON.stringify(results, null, 2));
    updateText(provider, edit);
    updateText(provider, results[0]);
}

