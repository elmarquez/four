'use strict';

module.exports = {
  css: {
    files: [{
      expand: false,
      cwd: '.',
      src: ['lib/css/four.css'],
      dest: 'dist/four.min.css'
    }]
  }
};
