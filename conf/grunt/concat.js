'use strict';

module.exports = {
  options: {
    banner: '"use strict";\n\nvar FOUR = FOUR || {};\n\n',
    separator: ';\n\n'
  },
  dist: {
    src: ['lib/**/*.js','!lib/workers/**/*.js'],
    dest: 'dist/four.js'
  }
};
