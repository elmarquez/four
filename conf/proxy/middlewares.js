'use strict';

/**
 * Express middleware to proxy API requests to the backend service.
 */
var options,
    S = require('string'),
    request = require('request');

/**
 * Execute http request
 * @param req Request
 * @param res Response
 * @param options Request options
 */
function executeRequest(req, res, options) {
  console.log("%s %s", req.method, options.url);
  if (req.method === 'DELETE') {
    request.delete(options).pipe(res);
  } else if (req.method === 'GET') {
    request.get(options).pipe(res);
  } else if (req.method === 'POST') {
    options.body = req.body;
    options.json = true;
    request.post(options).pipe(res);
  } else if (req.method === 'PUT') {
    options.body = req.body;
    options.json = true;
    request.put(options).pipe(res);
  }
}

module.exports = {
  // default URL to the API
  api: 'http://115.146.85.182/api',

  // API authentication credentials
  auth: {
    user: null,
    pass: null
  },

  // middleware functions should be listed here in reverse order to their
  // intended execution ex. C, B, A
  middlewares: [

    /**
     * Handle backend requests.
     * @param req Request
     * @param res Response
     * @param next Next
     */
    function (req, res, next) {
      var options = {};
      console.log('asking for', req.url);
      if (S(req.url).startsWith('/api/')) {
        options = {
          headers: {'Access-Control-Allow-Origin': '*'},
          url: module.exports.api + S(req.url).chompLeft('/api').s
        };
        console.log(options.url);
        // options.auth = module.exports.auth.user ? module.exports.auth : null;
        executeRequest(req, res, options);
      } else {
        next();
      }
    }
  ]
};
