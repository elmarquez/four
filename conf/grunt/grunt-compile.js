'use strict';

module.exports = function (grunt) {
  grunt.registerTask('compile', 'Compile a distributable version of the application in /dist.',
    function () {
      grunt.task.run([
        'jshint:src',
        'clean',
        'copy:css',
        'copy:fonts',
        'copy:workers',
        'concat',
        'cssmin',
        'uglify',
        'copy:dist',
        'copy:img'
      ]);
    }
  );
};
