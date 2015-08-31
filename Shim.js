WebInspector = {};
require("./lib/diff_match_patch.js");
require("./lib/utilities.js");
require("./lib/TextRange.js");
require("./lib/SourceMapEditor.js");
require("./client/Client.js");

var TestSourceProvider = require("./TestSourceProvider");

var provider = new TestSourceProvider("res");
var mapURL = "all.css.map";


var content1 = "border: 1px solid black;\ncolor: red;";
var content2 = "border: 2px dotted red;\ncolor: green;";
var edits = SMEditor.computeEditDiff("test.css", content1, content2);
for (var edit of edits) {
    console.log(JSON.stringify(edit, null, 2));
}


provider.sourceForURL(mapURL)
    .then(runTestSuite)
    .catch(function(e) { console.error(e.stack); });

function runTestSuite(mapPayload) {
    var map = new WebInspector.EditableSourceMap(JSON.parse(mapPayload), mapURL);
    return Promise.resolve()
        .then(bindRunTest(provider, map, new WebInspector.TextRange(0, 4, 0, 6), "bitch"))
        .then(bindRunTest(provider, map, new WebInspector.TextRange(0, 62, 0, 64), "40"));
}

function editOriginal(provider, map, oldRange, newText) {
    return provider.sourceForURL(map.originURL()).then(function(content) {
        // Extract old text.
        var oldText = oldRange.extract(content);
        // Update content.
        content = oldRange.replaceInText(content, newText);
        console.log("==== ORIGINAL\n%s\n", content);
        provider.setSourceForURL(map.originURL(), content);
        return new SMEditor.Edit(map.originURL(), oldRange, oldText, newText);
    });
}

function updateText(provider, edit) {
    return provider.sourceForURL(edit.sourceURL).then(function(content) {
        content = edit.oldRange.replaceInText(content, edit.newText);
        provider.setSourceForURL(edit.sourceURL, content);
        console.log("==== %s\n%s\n", edit.sourceURL, content);
    });
}

function runTest(provider, map, range, text) {
    return editOriginal(provider, map, range, text).then(function(edit) {
        return SMEditor.doEdit(provider, map, edit);
    }).then(function(results) {
        console.log(JSON.stringify(results, null, 2));
        return updateText(provider, results[0]);
    });
}

function bindRunTest(provider, map, range, text) {
    return runTest.bind(null, provider, map, range, text);
}
