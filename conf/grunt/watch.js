'use strict';

module.exports = {
    options: {
        debounceDelay: 250,
        spawn: false
    },
    src: {
        files: ['conf/**/*','demo/**/*','lib/**/*','test/**/*'],
        tasks: ['compile','test']
    }
    //,test: {
    //    files: ['test/**/*.js'],
    //    tasks: ['test']
    //}
};
