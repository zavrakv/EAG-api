const { Association } = require('../models/association');
const { User } = require('../models/user');
const Abbyy = require('./AbbyyLingvo/lingvoController');
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
    const offset = req.body.offset;
    
    let response_handler = function (response) {
      let body = '';
      response.on('data', function (d) {
        body += d;
      });
      response.on('end', function () {
        body = JSON.parse(body);
        res.send({ statusCode: 200, body });
      });
      response.on('error', function (e) {
        res.send({ statusCode: 400, message: `Error: ${e.message}` });
      });
    };
  
    let bing_image_search = function (search) {
      let request_params = {
        method : 'GET',
        hostname : host,
        path : path + '?q=' + encodeURIComponent(search) + '&offset=' + offset,
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
  },
  
  getTranslation(req, res) {
    Abbyy.getTranslation(req.body.keyword)
      .then((miniCard) => {
        res.send({ statusCode: 200, miniCard });
      });
  },
  
  getAudio(req, res) {
    Abbyy.getAudioFile(req.body.DictionaryName, req.body.SoundName)
      .then((audio) => {
        res.send({ audio });
      });
  },
  
  saveAssociation(req, res) {
    const { association, userId } = req.body;
    
    User.findById(userId)
      .then((user) => {
        const assocs = user.associations;
        
        let promise = new Promise((resolve, reject) => {
          for (let i = 0; i < assocs.length; i++) {
            if (association.originalWord === assocs[i].originalWord) {
              if (Association.isNotUniqueAssociation(association.translation, assocs[i].translation)) {
                reject('Is not unique pair "original word - translation"');
                break;
              }
            }
          }
          resolve('Is unique');
        });
        
        promise.then(() => {
          user.associations.push(association);
          user.save()
            .then(() => {
              res.send({ msg: `Association for word '${association.originalWord}' was successfully created!`, statusCode: 200 });
            })
            .catch((err) => {
              res.send({ err });
            });
        })
        .catch((err) => {
          res.send({ err, statusCode: 400 })
        });
        
      })
      .catch((err) => {
        res.send({ err });
      });
  },
  
  getAssociationList(req, res) {
    const { offset, pageSize, userId } = req.query;
    console.log(req.query);
    User.findById(userId)
      .then((user) => {
        const totalCount = user.associations.length;
        let page = user.associations.splice(offset, pageSize);
        
        res.send({ page, totalCount })
      })
      .catch((err) => {
        res.send({ err })
      })
  }
  
};

module.exports = association;
