'use strict';

module.exports = {
    options: {
        jshintrc: 'conf/jshintrc.json',
        reporter: require('jshint-summary')
    },
    src: {
        src: [
            'Gruntfile.js',
            'conf/**/*.js',
            '!dist/**/*.js',
            'lib/**/*.js',
            '!lib/controls/dist/**/*',
            '!lib/fonts/**/*',
            'test/**/*.js'
        ]
    }
};
