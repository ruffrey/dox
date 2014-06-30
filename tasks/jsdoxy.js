/*
 * # grunt-jsdoxy
 * 
 * forked from Matt McManus grunt-dox https://github.com/punkave/grunt-dox
 * 
 * Licensed under the MIT license.
 */

var exec = require('child_process').exec,
    fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    jade = require('jade'),
    async = require('async');


module.exports = function(grunt) {

  grunt.registerMultiTask('jsdoxy', 'Generate jsdoxy output ', function() {

    var dir = this.filesSrc,
        dest = this.data.dest,
        done = this.async(),
        doxPath = path.resolve(__dirname,'../'),
        _opts = this.options(),
        _args = [],
        outputFile = _opts.jsonOutput || "jsdoxy-output.json";

    // if(!fs.existsSync(outputFile)) {
    //   grunt.log.writeln('jsdoxy: making file ' + outputFile);
    //   grunt.file.write(outputFile, " ");
    // }

    // Absolute path to jsdoxy
    var jsdoxy = [doxPath, 'bin', 'jsdoxy'].join(path.sep);

    // Cleanup any existing docs
    rimraf.sync(dest);

    var executeFiles = [];
    var output = [];

    dir.forEach(function(file) {
      executeFiles.push(function(cb){

        var filepath = path.join(dest, file + ".json");
        grunt.file.write(filepath, " ");
        exec(
          jsdoxy + ' < ' + file + " > " + filepath, 
          {maxBuffer: 5000*1024}, 
          function(error, stout, sterr) {
            if (error) { 
              grunt.log.error("jsdoxy ERROR:  "+ error + "\n" + error.stack);
              cb(err); 
            }
            if (!error) {
              grunt.log.ok( file + '" got doxxed, son.');
              output = output.concat( grunt.file.readJSON(filepath) );
              cb();
            }
        });
      });
    });

    async.series(executeFiles, function(err) {
      if(err) return;

      if(!_opts.template) return done();
          
        grunt.log.writeln('Jadifying the output using template ' + _opts.template);

        var organizedByClass = {};

        output.forEach(function(comment) {
          comment.tags.forEach(function(tag) {
            if(tag.type == "class")
            {
              organizedByClass[tag.string] = comment;
              return false;
            }
          });
        });

        grunt.file.write(outputFile, JSON.stringify(organizedByClass, null, 4));

        // var html = jade.renderFile('filename.jade', merge(options, locals));

        done();
    });
      

  });

};