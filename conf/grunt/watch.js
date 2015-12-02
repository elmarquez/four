'use strict';

module.exports = {
    options: {
    },
    test: {
        files: ['conf/**/*.js','lib/**/*.js','test/**/*.js'],
        tasks: ['compile','test'],
        options: {
            debounceDelay: 250,
            spawn: false
        }
    }
};
