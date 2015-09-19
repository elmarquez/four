'use strict';

/**
 * Execute test suite against Selenium server.
 * TODO the application service and UI have to be deployed
 */
module.exports.config = {
  allScriptsTimeout: 11000,
  // FIXME factor out into configuration
  baseUrl: 'http://localhost:3000/app/',
  capabilities: {
    'browserName': 'chrome'
  },
  framework: 'jasmine',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000,
    showColors: true,
    silent: true
  },
  onPrepare: function () {
    // JUnit report
    // @see https://github.com/angular/protractor/blob/master/spec/junitOutputConf.js
    // @see https://github.com/angular/protractor/issues/60
    require('jasmine-reporters');
    jasmine.getEnv().addReporter(new jasmine.JUnitXmlReporter('target/junit', true, true));
    // Spec report
    var SpecReporter = require('jasmine-spec-reporter');
    jasmine.getEnv().addReporter(new SpecReporter({displayStackTrace: true}));
  },
  // FIXME factor selenium address out into configuration
  seleniumAddress: 'http://ci.aurin.org.au:4444/wd/hub',
  specs: [ '../../test/e2e/**/*.js' ]
};
