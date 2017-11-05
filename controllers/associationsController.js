const { Association } = require('../models/association');
const env = process.env.NODE_ENV;
const config = require('../config/config.json')[env];
const https = require('https');
// Replace the subscriptionKey string value with your valid subscription key.
const subscriptionKey = '7135722587644359ba9189fe4a4fca8b';
const host = 'api.cognitive.microsoft.com';
const path = '/bing/v7.0/images/search';

const association = {
  
  findAssociations(req, res) {
  
    const term = req.body.keyword;
    
    let response_handler = function (response) {
      let body = '';
      response.on('data', function (d) {
        body += d;
      });
      response.on('end', function () {
        console.log('\nRelevant Headers:\n');
        for (var header in response.headers)
          // header keys are lower-cased by Node.js
          if (header.startsWith("bingapis-") || header.startsWith("x-msedge-"))
            console.log(header + ": " + response.headers[header]);
        body = JSON.parse(body);
        console.log('\nJSON Response:\n');
        res.send({ statusCode: 200, body });
      });
      response.on('error', function (e) {
        res.send({ statusCode: 400, message: `Error: ${e.message}` });
      });
    };
  
    let bing_image_search = function (search) {
      console.log('Searching images for: ' + term);
      let request_params = {
        method : 'GET',
        hostname : host,
        path : path + '?q=' + encodeURIComponent(search),
        headers : {
          'Ocp-Apim-Subscription-Key' : subscriptionKey,
        }
      };
    
      let req = https.request(request_params, response_handler);
      req.end();
    };
  
    if (subscriptionKey.length === 32) {
      bing_image_search(term);
    } else {
      console.log('Invalid Bing Search API subscription key!');
      console.log('Please paste yours into the source code.');
    }
  }
  
};

module.exports = association;
