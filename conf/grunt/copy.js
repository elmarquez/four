'use strict';

module.exports = {
  dist: {
    cwd: 'lib',
    src: [ '**/*','!controls/dist/**/*' ],
    dest: 'dist/four',
    expand: true
  }
};
