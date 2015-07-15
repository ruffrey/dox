/*
 * # grunt-jsdoxy
 *
 * forked from Matt McManus grunt-dox https://github.com/punkave/grunt-dox
 *
 * Licensed under the MIT license.
 */
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var jade = require('jade');
var async = require('async');
var markdown = require('../lib/markdown');

module.exports = function(grunt) {

    grunt.registerMultiTask('jsdoxy', 'Generate jsdoxy output ', function jsdoxyTask() {

        var dir = this.filesSrc;
        var dest = this.data.dest;
        var done = this.async();
        var doxPath = path.resolve(__dirname, '../');
        var _opts = this.options();
        _opts.template = _opts.template || path.normalize(__dirname + "/../default-template.jade");
        var _args = [];
        var outputFile = _opts.jsonOutput || "jsdoxy-output.json";
        var stylesheet = _opts.stylesheet
            || "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.4/paper/bootstrap.min.css";

        // Absolute path to jsdoxy
        var jsdoxy = [doxPath, 'bin', 'jsdoxy'].join(path.sep);


        // add flags
        if (_opts.skipSingleStar) {
            jsdoxy += " --skipSingleStar";
        }

        // Cleanup any existing docs
        rimraf.sync(dest);

        var executeFiles = [];
        var output = [];
        var allFileLinks = [];
        var markdownFiles = [];

        dir.forEach(forEachFile);

        function forEachFile(file) {
            executeFiles.push(execFile);

            function execFile(cb) {

                // Markdown files.
                // these are treated differently.
                var isMarkdown = path.extname(file) === '.md';
                if (isMarkdown) {
                    markdownFiles.push(file);
                    var filenameOut = _opts.flatten
                        ? path.basename(file, '.md') + '.html'
                        : file.replace('.md', '.html');
                    allFileLinks.push(filenameOut);
                    cb();
                    return;
                }


                // Code files.
                // Probably with .js extension.

                var outputFilepath = path.join(dest, file + ".json");

                // the exec'd process seems to not have proper permissions to write,
                // unless the file exists already
                grunt.file.write(outputFilepath, " ");

                // capture the outputted file
                var jsdoxyCommand = jsdoxy + ' < ' + file + " > " + outputFilepath;
                var soMuch = 5000 * 1024;
                var execOptions = { maxBuffer: soMuch };

                exec(jsdoxyCommand, execOptions, onFileDoxxed);

                function onFileDoxxed(error, stout, sterr) {
                    if (error) {
                        grunt.log.error("jsdoxy ERROR:  " + error + "\n" + error.stack);
                        grunt.log.error(sterr);
                        return cb(err);
                    }
                    grunt.log.ok(file + '" got doxxed, yo!');
                    var fileJson = grunt.file.readJSON(outputFilepath);

                    fileJson.forEach(function(comment) {
                        if (!comment.ctx) comment.ctx = {};

                        comment.ctx.file = {
                            input: file,
                            output: outputFilepath
                        };
                    });

                    // then rewrite it with the most recent details
                    grunt.file.write(outputFilepath, JSON.stringify(fileJson, null, 4));

                    output = output.concat(fileJson);
                    cb();
                }
            }
        }

        async.series(executeFiles, function afterExec(err) {
            if (err) throw err;


            var organizedByClass = {};
            var lastClassnameWas = "";


            // comments.forEach, really
            output.forEach(function (comment) {
                var thisCommentGoesSomewhereElse = null;
                
                function moveComment() {
                    grunt.log.ok(
                        'Moving "event" comment from',
                        lastClassnameWas, 'to',
                        comment.ctx.name
                    );
                    if (!organizedByClass[thisCommentGoesSomewhereElse]) {
                        organizedByClass[thisCommentGoesSomewhereElse] = [];    
                    }
                    organizedByClass[thisCommentGoesSomewhereElse].push(comment);
                    return;
                }
                
                //
                // Important:
                // the `@class SomeClass` comment should always be in the first comment.
                //

                //
                // Organize the comments by @class.
                // 
                // Unless it's an event that is documented on a different class.
                // Then move it to the right class.
                
                if (comment.ctx.type && comment.ctx.name) {
                    if (comment.ctx.type === 'event' && !~comment.ctx.name.indexOf(lastClassnameWas) ) {
                        thisCommentGoesSomewhereElse = comment.ctx.name.split('#')[0];
                        moveComment();
                    }
                }
                comment.tags.forEach(function (tag) {
                    
                    // Start a new class here
                    if (tag.type === 'class') {
                        if (comment.isPrivate && !_opts.outputPrivate) {
                            // do not include the private comments unless specified
                        } else {
                            lastClassnameWas = tag.string;
                            organizedByClass[lastClassnameWas] = [];
                            comment.ctx.name = lastClassnameWas;
                        }
                    }
                    if (tag.type === 'event' && tag.string && !~tag.string.indexOf(lastClassnameWas) ) {
                        thisCommentGoesSomewhereElse = tag.string.split('#')[0];
                    }
                });
                if (thisCommentGoesSomewhereElse) return moveComment();
                if (!lastClassnameWas) return;

                organizedByClass[lastClassnameWas].push(comment);

            });

            // writing out a giant JSON blob of everything, into one file
            grunt.file.write(outputFile, JSON.stringify(organizedByClass, null, 4));
            grunt.log.ok(
                "Organized docs into " + Object.keys(organizedByClass).length + " classes and wrote to " + outputFile
            );

            if (_opts.template === false) return done();

            if (!fs.existsSync(_opts.template)) return done(new Error(_opts.template + " does not exist!"));

            grunt.log.ok('Jadifying the output using template ' + _opts.template);

            // first get the file list for code comments
            Object.keys(organizedByClass).forEach(function(classKey) {
                var filenameOut = _opts.flatten
                    ? classKey + ".html"
                    : organizedByClass[classKey][0].ctx.file.input.replace('.js', '.html');
                allFileLinks.push(filenameOut);
            });

            // render the code comments, by class, into the jade template
            Object.keys(organizedByClass).forEach(function(classKey) {
                var thisClassDocs = organizedByClass[classKey];

                var classCommentLink;

                thisClassDocs.forEach(function(comment) {
                    comment.tags.forEach(function(tag) {
                        if (tag.type === "link") classCommentLink = tag.string;

                        if (classCommentLink) return false;
                    });
                    if (classCommentLink) return false;
                });

                var filenameOut = _opts.flatten
                    ? classKey + ".html"
                    : organizedByClass[classKey][0].ctx.file.input.replace('.js', '.html');
                var jadeLocals = {
                    structure: organizedByClass,
                    comments: thisClassDocs,
                    className: classKey,
                    link: classCommentLink,
                    files: allFileLinks,
                    basePath: _opts.basePath,
                    filenameOut: filenameOut,
                    stylesheet: stylesheet
                };
                grunt.log.ok('Rendering docs page', filenameOut, 'with template', _opts.template, thisClassDocs.length, 'comments');
                var html;
                try {
                    html = jade.renderFile(_opts.template, jadeLocals);
                } catch (ex) {
                    grunt.log.error('!! Failed rendering', filenameOut, ex);
                    return;
                }
                grunt.file.write(path.join(dest, filenameOut), html);
                grunt.log.ok('Successfully rendered docs page', filenameOut);

            });
            
            // render the markdown pages
            markdownFiles.forEach(function(file) {
                var filenameOut = file.replace('.md', '.html');
                var outpath = path.join(dest, filenameOut);
                grunt.log.ok('Outputting markdown file ' + outpath);
                var mdContents = markdown(fs.readFileSync(file, {
                    encoding: 'utf8'
                }));
                grunt.log.ok('Rendering markdown page ' + filenameOut, 'with template', _opts.template);

                var html = jade.renderFile(_opts.template, {
                    structure: organizedByClass,
                    mdContents: mdContents,
                    comments: [],
                    className: file,
                    files: allFileLinks,
                    basePath: _opts.basePath,
                    filenameOut: filenameOut,
                    stylesheet: stylesheet
                });
                grunt.file.write(outpath, html);
            });

            // write a little contents page if there is not one yet
            if (_opts.generateIndex && allFileLinks.indexOf('index.html') === -1) {
                grunt.log.ok('Generating index page.');
                var html = jade.renderFile(_opts.template, {
                    mdContents: '<h1>Documentation</h1>',
                    comments: [],
                    structure: organizedByClass,
                    className: 'Index',
                    files: allFileLinks,
                    basePath: _opts.basePath,
                    filenameOut: 'index.html',
                    stylesheet: stylesheet
                });
                grunt.file.write(path.join(dest, 'index.html'), html);
            }

            done();
        });


    });

};
