module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 'server/**/*.js', 'test/**/*.js', '!server/web/public/**/*.js' ],
      options: {
        '-W097': true,  // ignore 'Use the function form of "use strict"' error
        esversion: 6,
        globals: {
          node: true,
          jQuery: true,
          require: true,
          exports: true,
          module: true,
          process: true,
          Buffer: true,
          console: true
        }
      }
    },

    ejslint: {
      target: ['server/web/views/**/*.ejs', 'server/web/public/partials/*.ejs']
    },
     
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },

    gettext: {
      options: {
        gettextPath: "/usr/bin",
        locales: ["en", "es"],
        localesFolder: "locale",
        extensions: {
          ejs: "php"
        }
      },
      xgettext: {
        src: ['server/web/views/**/*.ejs', 'server/web/public/partials/*.ejs', 'server/api/*.js'],
      },
      msginit: {},
      msgmerge: {}
    }
  
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ejslint');

  grunt.loadTasks('./tasks');

  grunt.registerTask('lint', ['ejslint', 'jshint']);
  grunt.registerTask('default', ['gettext']);

};
