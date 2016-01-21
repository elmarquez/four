'use strict';

module.exports = {
  css: {
    src: [ 'lib/css/four.css' ],
    dest: 'dist/four.css',
    expand: false
  },
  fonts: {
    cwd: 'fonts',
    src: [ '**/*' ],
    dest: 'dist/fonts',
    expand: true
  },
  workers: {
    cwd: 'lib/workers',
    src: [ '**/*' ],
    dest: 'dist/workers/',
    expand: true
  }
};
