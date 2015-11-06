'use strict';

module.exports = {
  fonts: {
    cwd: 'fonts',
    src: [ '**/*' ],
    dest: 'dist/fonts',
    expand: true
  },
  lib: {
    cwd: 'lib',
    src: [ '**/*','!controls/dist/**/*' ],
    dest: 'dist/four',
    expand: true
  }
};
