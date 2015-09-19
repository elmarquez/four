/*
 * undertow Gruntfile.js
 *
 * Private options could be set through .undertowrc in user HOME directory
 *
 */
'use strict';

require('sugar');
var _ = require('underscore');
var fs = require('fs');

module.exports = function(grunt) {

  var home = process.env.HOME
    , optionFile = home + '.undertowrc'
    , privateKey = home + '/.ssh/id_rsa'
    , passPhrase = home + '/.ssh/passphrase.txt'
    , userOptions = {};

  var options = {
    deployTarget: {
      host: 'apps.aurin.org.au',
      username: 'dev',
      privateKey: null,
      passphrase: null,
      pty: true
    }
  };

  if (fs.existsSync(privateKey)) {
    options.deployTarget.privateKey = fs.readFileSync(privateKey).toString();
  }
  if (fs.existsSync(passPhrase)) {
    options.deployTarget.passPhrase = fs.readFileSync(passPhrase).toString();
  }
  if (fs.existsSync(optionFile)) { userOptions = jf.readFileSync(optionFile); }
  options = _.extend(options, userOptions);

  main();

  function main() {

    // some defaults
    var config = {
      jsSrc         : 'src/'
    , jsDist        : 'target/dist/<%= pkg.version %>'
    , jsDevTarget   : 'target/dist/<%= pkg.version %>/dev/'
    , jsProdTarget  : 'target/dist/<%= pkg.version %>/min/'
    , jsFileMask    : '**/*.js'
    , deployArchive : '<%= pkg.name %>-<%= pkg.version %>.tgz'
    };

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'), // <%= pkg.name %> is available
      clean: {
        build: ['target']
      },
      copy: {
        files: {
          cwd: config.jsSrc,
          src: [config.jsFileMask],
          dest: config.jsDevTarget, // destination folder
          expand: true // allow dynamic building
        }
      },

      uglify: {
        options: {
          preserveComments: false,
          sourceMap: function(path) { return path.replace(/.js/, ".map")}
        },
        files: {
          cwd: config.jsSrc,
          src: [config.jsFileMask],
          dest: config.jsProdTarget,
          expand: true // allow dynamic building
        }
      },
      jshint: {
        cwd: config.jsSrc,
        src: [config.jsFileMask],
        options: {
          jshintrc: '.jshintrc',
          reporterOutput: 'target/jshint-report.txt'
        },
      },
      // plain mocha test
      mochaTest: {
        test: {
          options: {
            reporter: 'spec'
          },
          src: ['test/mocha/**/*.js']
        }
      },
      // mocha coverage: using blanket
      mochacov: {
        'html-cov': {
          options: {
            reporter: 'html-cov',
            require: ['should'],
            output: "target/coverage-mocha.html"
          },
          src: ['test/mocha/**/*.js']
        },
        'lcov': {
          options: {
            reporter: 'mocha-lcov-reporter',
            coverage: 'true',
            require: ['should'],
            output: "target/coverage-mocha.lcov"
          },
          src: ['test/mocha/**/*.js']
        }
      },
      // qunit test & coverage: using istanbul & phantomjs
      qunit: {
        files: ['test/qunit/**/*.html'],
        options: {
          '--web-security': 'no',
          coverage: {
            src: [config.jsSrc + config.jsFileMask],
            instrumentedFiles: '.tmp/',
            htmlReport: 'target/coverage/qunit',
            lcovReport: 'target/coverage/qunit',
            coberturaReport: 'target/coverage/qunit'
          }
        }
      },
      compress: {
        main: {
          options: {
            archive: 'target/' + config.deployArchive,
            mode: 'tgz'
          },
          files: [{
            expand: true,
            cwd: 'target/dist',
            src: ['<%= pkg.version %>/' + config.jsFileMask]
          }]
        }
      },
      // scp target/undertow-0.x.x.tgz dev@apps.aurin.org.au:/home/dev
      scp: {
        options: options.deployTarget,
        main: {
            files: [{
              cwd: 'target', // must be set
              src:  config.deployArchive,
              dest: '/home/dev'
            }]
        },
      },
      /* ssh -t dev@apps.aurin.org.au
       *   sudo tar xvf /home/dev/undertow-0.x.x.tgz
       *   -C /var/www/html/apps.aurin.org.au/assets/js/undertow
       */
      sshexec: {
        test: {
          command: 'sudo tar xvf /home/dev/' + config.deployArchive + ' -C /var/www/html/apps.aurin.org.au/assets/js/undertow',
          options: options.deployTarget
        }
      }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-qunit-istanbul');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha-cov');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-scp');
    grunt.loadNpmTasks('grunt-ssh');

    grunt.registerTask('package', ['copy', 'uglify']);
    grunt.registerTask('test', ['mochaTest', 'qunit']);
    grunt.registerTask('coverage', ['mochacov', 'qunit']);
    grunt.registerTask('default', ['uglify']);
  }

};