# jsdoxy

A [jsdoc-ish](http://usejsdoc.org) documentation generator forked from [visionmedia/dox](https://github.com/visionmedia/dox).

### Differences from visionmedia/dox

* Allows multiline tag comments.
* Supports code context on string key properties like `someobject['asdf-jkl']`.
* Code context and parsing for more things:
	* `@event`
	* `@fires`
	* `@auth`
	* `@augments`
* Uses a supported markdown parser ([marked](https://github.com/chjj/marked)) instead of the
	old deprecated one.
* Includes a **grunt plugin** `jsdoxy`.
	* Comments are organized into a plain object with the `@class MyClass` tag as the key.
	* Optionally renders the JSON output using [Jade](http://jade-lang.com).

# Usage

**_Note_**
You must use the `@class` comment as your first comment per file. `@class myClass` is used
to organize the output (this is different than the original Dox project. If you fail to do this,
you will have no output.

## Globally

One file at a time.

	npm install -g jsdoxy

You can do this from the terminal

	$>  jsdoxy --help

	  Usage: jsdoxy [options]

	  Options:

	    -h, --help     output usage information
	    -V, --version  output the version number
	    -r, --raw      output "raw" comments, leaving the markdown intact
	    -a, --api      output markdown readme documentation
	    -d, --debug    output parsed comments for debugging

	  Examples:

	    # stdin
	    $ jsdoxy > myfile.json

	    # operates over stdio
	    $ jsdoxy < myfile.js > myfile.json


## Grunt plugin

Multiple files at a time, organizing the output by the `@class` tag, optionally rendered using a jade template.

Install the package to your project with NPM

	npm install jsdoxy --save-dev

then in your source code, the `@class` tag should **always** be part of the first comment

```javascript
	/**
	 * A class that does something.
	 *
	 * Use it in this way.
	 * @class MyClass
	 * @param object opts Some parameters to get you started.
	 */
	function MyClass (opts) {
		. . .
	}
```

then inside `Gruntfile.js` at the project root

```javascript
    grunt.loadNpmTasks('jsdoxy');

    grunt.initConfig({
		jsdoxy: {
            options: {
				// JSON data representing your code. Not optional.
            	jsonOutput: 'jsdoxy-output.json',

				// A Jade template which will receive the locals below. Optional.
				// Set to `false` to disable building this template. Other falsey values
				// will use the default template.
				template: 'your-template.jade',
				// when using a template, what is the base path for all of the links
				// to work from?
				basePath: '', // '/docs'

            	// Indicates whether to output things marked @private when building docs
				outputPrivate: false,
				// make an index landing page
				generateIndex: false,
				// flatten the outputted files into one directory
				flatten: false
            },
            files: {
                src: [ . . . ],
                dest: '. . .'
            }
        }
	});
```

yields `jsdoxy-output.json`

```json
	{
		"MyClass": {
	        "tags": [
	            {
	                "type": "class",
	                "string": "MyClass"
	            },
	            {
	                "type": "param",
	                "types": [
	                    "object"
	                ],
	                "name": "opts",
	                "description": "Some parameters to get you started."
	            }
	         ],
			 "returns": "Object || String",
			 "fires": [{ "type": "fires", "string": "some-event" }],
	         "description": {
	           "full": "<p>A class that does something.</p><p>Use it in this way.</p>",
	           "summary": "<p>A class that does something.</p>",
			   "body": "<p>Use it in this way.</p>"
	        },
	        "isPrivate": false,
	        "ignore": false,
	        "code": "function MyClass(opts) { . . . }",
	        "ctx": {
	            "type": "declaration",
	            "name": "MyClass",
	            "string": "idk what goes here",
	            "file": {
	            	"input": "./input/file/path/file.js",
	            	"output": "./output/file/path/file.js.json"
	            }
	        }
	    }
	}
```

### Jade template

There is a default template which will be used unless you pass the config option `template: false`.

If you pass an empty string or do not include anything, it will render using the
`default-template.jade` in this repository.

The jade template will receive the following locals:

```javascript
	var jadeLocals = {
      structure:  organizedByClass,
      comments:   thisClassDocs,
      className:  classKey,
      link: classCommentLink,
	  files: allFileLinks,
	  basePath: basePath,
	  filenameOut: filenameOut
    };
```

#### Default template

![default jade jsdoxy template](https://i.imgur.com/4vMyjsZ.png)

### Markdown files
Any markdown files with the extension `.md` will be turned into HTML files and rendered
with the jade template.

# License

(c) 2014 - 2015 Jeff H. Parrish

jeffhparrish@gmail.com

MIT

Forked from [tj/dox](https://github.com/tj/dox)
