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
    jade = require('jade');


module.exports = function(grunt) {

  grunt.registerMultiTask('jsdoxy', 'Generate jsdoxy output ', function() {

    var dir = this.filesSrc,
        dest = this.data.dest,
        done = this.async(),
        doxPath = path.resolve(__dirname,'../'),
        _opts = this.options(),
        _args = [];

    // Absolute path to jsdoxy
    var jsdoxy = [doxPath, 'bin', 'jsdoxy'].join(path.sep);

    // Cleanup any existing docs
    rimraf.sync(dest);

    _args.push('--source');
    _args.push(dir);
    _args.push('--target');
    _args.push(dest);

    // Set options to arguments
    if(_opts.title){
      _args.push('--title');
      _args.push('"' + _opts.title + '"');
    }

    if (_opts.template) {
      _args.push('--template');
      _args.push('"' + _opts.template + '"');
    }

    // Pass through ignore params if set
    if (this.data.ignore) {
      _args.push('--ignore');
      this.data.ignore.forEach(function(ignorePath) {
        _args.push(doxPath + ignorePath);
      });
      
    }

    exec(jsdoxy + ' ' + _args.join(" "), {maxBuffer: 5000*1024}, function(error, stout, sterr){
      if (error) { grunt.log.error("ERROR:  "+ error + "\n" + error.stack); }
      if (!error) {
        grunt.log.ok('Directory "' + dir + '" doxxed by jsdoxy.');
        done();
      }
    });
  });

};