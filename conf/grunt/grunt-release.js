module.exports = function (grunt) {
  'use strict';
  grunt.registerTask('release', 'Create and tag a release',
    function (increment) {
      var bump = 'bump:' + (increment || 'patch');
      grunt.task.run(['checkbranch:master', 'compile', bump]);
    }
  );
};
