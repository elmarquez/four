'use strict';

module.exports = {
  options: {
    banner: '"use strict";\n\nvar FOUR = FOUR || {};\n\n',
    separator: ';'
  },
  dist: {
    src: ['lib/**/*.js'],
    dest: 'dist/four.js'
  }
};
