module.exports = {
  options: {
    jshintrc: 'conf/jshintrc.json',
    reporter: require('jshint-summary'),
    reporterOutput: 'target/jshint.log'
  },
  src: [
    'Gruntfile.js',
    'conf/**/*.js',
    'lib/**/*.js',
    'test/**/*.js'
  ]
};
