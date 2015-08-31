var gulp = require("gulp");
var ClosureCompiler = require("closurecompiler");

gulp.task("default", function(done) {
    ClosureCompiler.compile(["client/Runtime.js", "lib/utilities.js", "lib/TextRange.js", "lib/SourceMapEditor.js", "client/ParsedURL.js", "client/SourceMap.js", "Shim.js"],
        {
            summary_detail_level: "3",
            jscomp_error: "visibility",
            compilation_level: 'SIMPLE_OPTIMIZATIONS',
            warning_level: 'VERBOSE',
            language_in: "ES6_STRICT",
            language_out: "ES5_STRICT",
            extra_annotation_name: [
                "suppressReceiverCheck",
                "suppressGlobalPropertiesCheck"
            ],
            externs: [
                "node",
                "externs.js"
            ]
        },
        function(error, result) {
            console.log(error);
            done();
        }
    );
});
