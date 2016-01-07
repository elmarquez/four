'use strict';

module.exports = {
    options: {
        debounceDelay: 250,
        spawn: false
    },
    src: {
        files: ['conf/**/*.js','demo/**/*','lib/**/*.js','test/**/*.js'],
        tasks: ['compile','test']
    }
    //,test: {
    //    files: ['test/**/*.js'],
    //    tasks: ['test']
    //}
};
