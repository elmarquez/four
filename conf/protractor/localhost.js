'use strict';

/**
 * Execute test suite against local Selenium host and application deployment.
 */
module.exports.config = {
  allScriptsTimeout: 11000,
  baseUrl: 'http://localhost:8081',
  capabilities: {
    'browserName': 'firefox'
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
  seleniumAddress: 'http://localhost:4444/wd/hub',
  //specs: ['../../test/e2e/**/*.js']
  //specs: ['../../test/e2e/application.*.js']
  //specs: [ '../../test/e2e/data-registry/**/*.js' ]
  specs: [ '../../test/e2e/monitoring/components.js' ]
  //specs: [ '../../test/e2e/user-management/**/*.js' ]
  //specs: [ '../../test/e2e/workflow/**/*.js' ]
};
