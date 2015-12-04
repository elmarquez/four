'use strict';

module.exports = function (grunt) {
  grunt.registerTask('docs', 'Generate documentation in /docs.',
    function () {
      grunt.task.run(['clean:docs','jsdoc']);
    }
  );
};
