'use strict';

module.exports = function(grunt) {

  const lodash = require('lodash');
  const { spawn } = require('child_process');
  const fs = require('fs');
  const path = require('path');

  const localTmpFolder = './tmp';
  const xgettextInputfile = localTmpFolder + '/xgettext.in.txt';

  grunt.registerMultiTask('gettext', 'GetText related targets', function() {
    var done = this.async();
    var options = validateOptions(grunt.config('gettext').options);

    // inject the name of the template file into the options object
    options.templateFile = options.localesFolder + '/messages.pot';

    grunt.file.mkdir(localTmpFolder);

//    console.log('this => ' + JSON.stringify(this));
//    console.log('options => ' + JSON.stringify(options));

    switch (this.target) {
      case 'xgettext':
        runXgetText(options, this.filesSrc, done);
        break;

      case 'msginit':
        runMsgInit(options, done);
        break;

      case 'msgmerge':
        runMsgMerge(options, done);
        break;

      default:
        grunt.fail.warn('Unrecognized target: ' + this.target);
        done();
        break;
    }
  });



  /**
   * Validate that any provided options are valid, inserting any defaults as
   * appropriate.
   * 
   * @param {Object} options
   * @returns An options object, created if necessary, with any defaults inserted
   */
  function validateOptions (options) {
    if (!options) {
      options = {};
    }

    if (options.gettextPath) {
      if ('string' === typeof options.gettextPath) {
        if (!options.gettextPath.endsWith('/')) {
          options.gettextPath += '/';
        }
      }
      else {
        grunt.fail.fatal('gettextPath option must be a string');
      }
    }
    else {
      options.gettextPath = '';
    }

    if (options.localesFolder) {
      if (!('string' === typeof options.localesFolder)) {
        grunt.fail.fatal('localesFolder option must be a string');
      }
    } else {
      options.localesFolder = './locale';
    }

    if (options.locales) {
      if (!(options.locales instanceof Array) || options.locales.length === 0) {
        grunt.fail.warn('No locales option configured for gettext task.');
      }
    } else {
      options.locales = ['en'];
    }

    if (options.extensions) {
      if (!(options.extensions instanceof Object) || Object.keys(options.extensions).length === 0) {
        grunt.fail.warn('No extension mapping option configured for gettext task.');
      }
    } else {
      options.extensions = {};
    }

    return options;
  }



  /**
   * Run the xgettext app to create the template file.
   * 
   * @param {object} options 
   * @param {Array} srcFiles 
   * @param {function} done 
   */
  function runXgetText (options, srcFiles, done) {
    if (grunt.file.exists(options.templateFile) && !grunt.file.isFile(options.templateFile)) {
      grunt.fail.fatal('Existing folder/link ' + options.templateFile + 'is in the way. Please remove it.');
    }
    else {
      var fileExtObj = {};
      
      // group files by extension
      srcFiles.forEach ( (srcFile) => {
        var ext = path.extname(srcFile);
        if (!fileExtObj.hasOwnProperty(ext)) {
          fileExtObj[ext] = [];
        }
        fileExtObj[ext].push(srcFile);
      });

      var extCnt = Object.keys(fileExtObj).length;
      var templateFiles = [];

      var extDone = function () {
        extCnt--;
        if (extCnt === 0) {
          runMsgCat (options, templateFiles, done);
        }
      }

      lodash.map(Object.keys(fileExtObj), function(ext) {
        var inputFile = xgettextInputfile + ext;
        var outputFile = options.templateFile + ext + '.pot';
        var strm = fs.createWriteStream(inputFile);

        console.log(`processing extension ${ext}`);

        strm.on('error', (err) => {
          console.log(`Error on writestrm: ${err}`);
        });

        strm.on('finish', () => {
          // xgettext -o .\locale\messages.pot -f ./tmp/xgettext.in.txt -j
          const args = ['-o', outputFile, '-f', inputFile];
          if (grunt.file.exists(outputFile) && grunt.file.isFile(outputFile)) {
            args.push('-j');
          }
          var lang = options.extensions[ext.substr(1)];
          if (lang != undefined) {
            args.push('--language=' + lang);
          }

          const app = spawn(options.gettextPath + 'xgettext', args);
    
          app.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });
    
          app.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
          });
    
          app.on('close', (code) => {
            console.log(`xgettext process exited with code ${code}`);
            grunt.file.delete(inputFile);
            templateFiles.push(outputFile);
            extDone();
          });
        });
      
        fileExtObj[ext].forEach ( (srcFile) => {
          strm.write(srcFile + "\r\n");
        });
        strm.end(); // will trigger the 'finish' event on the stream
      });
    }
  }



  /**
   * Run the msgcat app to create concatinated template file.
   * 
   * @param {object} options 
   * @param {Array} templateFiles 
   * @param {function} done 
   */
  function runMsgCat (options, templateFiles, done) {
    if (grunt.file.exists(options.templateFile) && !grunt.file.isFile(options.templateFile)) {
      grunt.fail.fatal('Existing folder/link ' + options.templateFile + 'is in the way. Please remove it.');
    }
    else {
      var strm = fs.createWriteStream(xgettextInputfile);

      strm.on('error', (err) => {
        console.log(`Error on writestrm: ${err}`);
      });

      strm.on('finish', () => {
        // msgcat -o .\locale\messages.pot -f ./tmp/xgettext.in.txt -j
        const args = ['-o', options.templateFile, '-f', xgettextInputfile];
        const app = spawn(options.gettextPath + 'msgcat', args);
  
        app.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });
  
        app.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });
  
        app.on('close', (code) => {
          console.log(`msgcat process exited with code ${code}`);
          grunt.file.delete(xgettextInputfile);
          templateFiles.forEach ( (srcFile) => {
            grunt.file.delete(srcFile);
          });
          done();
        });
      });
    
      templateFiles.forEach ( (srcFile) => {
        strm.write(srcFile + "\r\n");
      });
      strm.end(); // will trigger the 'finish' event on the stream
    }
  }



  /**
   * Run the msginit app to create any new po files.
   * 
   * @param {object} options 
   * @param {function} done 
   */
  function runMsgInit (options, done) {
    var langCnt = options.locales.length;

    var langDone = function () {
      langCnt--;
      if (langCnt === 0) {
        done();
      }
    }

    lodash.map(options.locales, function(locale) {
      var poFile = options.localesFolder + "/" + locale + "/LC_MESSAGES/" + locale + ".po";

      if (!grunt.file.exists(poFile)) {
        console.log('Creating ' + poFile);

        // create a blank file (and any intermediate folders)
        grunt.file.write(poFile, '');

        // msginit -i .\locale\messages.pot -l en -o .\locale\en\LC_MESSAGES\en.po
        const app = spawn(options.gettextPath + 'msginit', ['-i', options.templateFile, '-l', locale, '-o', poFile]);

        app.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        app.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });

        app.on('close', (code) => {
          console.log(`msginit process exited with code ${code} processing ${poFile}`);
          langDone();
        });
      }
      else {
        langDone();
      }
    });
  }



  /**
   * Run the msgmerge app to merge any addtions/changes/deletions into the language po files.
   * 
   * @param {object} options 
   * @param {function} done 
   */
  function runMsgMerge (options, done) {
    var langCnt = options.locales.length;

    var langDone = function () {
      langCnt--;
      if (langCnt === 0) {
        done();
      }
    }

    lodash.map(options.locales, function(locale) {
      var poFile = options.localesFolder + "/" + locale + "/LC_MESSAGES/" + locale + ".po";

      if (grunt.file.exists(poFile) && grunt.file.isFile(poFile)) {
        console.log('Updating ' + poFile);

        // msgmerge -U --backup=none .\locale\en\LC_MESSAGES\en.po .\locale\messages.pot
        const ls = spawn(options.gettextPath + 'msgmerge', ['-U', '--backup=off', poFile, options.templateFile]);

        ls.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        ls.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });

        ls.on('close', (code) => {
          console.log(`msgmerge process exited with code ${code} processing ${poFile}`);
          langDone();
        });
      }
      else {
        langDone();
      }
    });
  }
};
