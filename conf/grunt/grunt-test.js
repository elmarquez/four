'use strict';

module.exports = function (grunt) {
    grunt.registerTask('test', 'Execute unit and functional tests.', function () {
        grunt.task.run(['jasmine']);
    });
};
