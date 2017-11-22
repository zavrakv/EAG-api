const env = process.env.NODE_ENV;
const config = require('../../config/config.json')[env];
const api_config = require('./config.json');
const https = require('https');
const Abbyy = {
  token: '',
  
  _authenticate() {
    const headers = {
      "Authorization": `Basic ${api_config.apiKey}`
    };
    const options = {
      rejectUnauthorized: false,
      method: 'POST',
      hostname: api_config.host,
      path: api_config.authenticate,
      headers: headers
    };
    
    return new Promise((resolve, reject) => {
      const request = https.get(options, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error('Auth failed: ' + response.statusCode));
        }
        
        const body = [];
        response.on('data', (chunk) => body.push(chunk));
        response.on('end', () => resolve(body.join('')));
      });
      request.on('error', (err) => reject(err))
    })
    
    
  },
  
  getMiniCard(keyword) {
    return Abbyy._authenticate()
      .then((token) => {
        this.token = token;
        
        const RU_ru = 1049;
        const EN_us = 1033;
        
        const headers = {
          "Authorization": `Bearer ${this.token}`
        };
        const options = {
          rejectUnauthorized: false,
          hostname: api_config.host,
          path: `${api_config.miniCard}?text=${keyword}&srcLang=${EN_us}&dstLang=${RU_ru}`,
          method: 'GET',
          headers: headers
        };
        return new Promise((resolve, reject) => {
          https.get(options, (response) => {
            const body = [];
            response.on('data', (chunk) => body.push(chunk));
            response.on('end', () => {
              resolve(JSON.parse(body.join('')))
            });
            response.on('error', (err) => reject(err));
          });
        });
      })
      .catch((err) => console.error(err));
  },
  
  getAudioFile(dictionary, fileName) {
    return Abbyy._authenticate()
      .then((token) => {
        this.token = token;
        
        const headers = {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "audio/wav"
        };
        
        const options = {
          rejectUnauthorized: false,
          hostname: api_config.host,
          path: `${api_config.audio}?dictionaryName=${dictionary}&fileName=${fileName}`,
          method: 'GET',
          headers: headers
        };
        
        return new Promise((resolve, reject) => {
          https.get(options, (response) => {
            let body = [];
            response.on('data', (chunk) => {
              body.push(chunk);
            });
            response.on('end', () => {
              body = body.join('').toString();
              resolve(body);
            });
            response.on('error', (err) => reject(err));
          });
        });
      })
      .catch((err) => console.error(err));
  },
  
  getTranslation(keyword) {
    return Abbyy._authenticate()
      .then((token) => {
        this.token = token;
        
        const RU_ru = 1049;
        const EN_us = 1033;
        
        const headers = {
          "Authorization": `Bearer ${this.token}`
        };
        const options = {
          rejectUnauthorized: false,
          hostname: api_config.host,
          path: `${api_config.translation}?text=${keyword}&srcLang=${EN_us}&dstLang=${RU_ru}`,
          method: 'GET',
          headers: headers
        };
        return new Promise((resolve, reject) => {
          https.get(options, (response) => {
            const body = [];
            response.on('data', (chunk) => body.push(chunk));
            response.on('end', () => {
              
              const Translations = JSON.parse(body.join(''));
              
              const resultTranslation = [];
              
              Translations.forEach((dictionary, index) => {
                
                resultTranslation.push({
                  dictionary: dictionary.Dictionary,
                  transcription: "",
                  soundArr: [],
                  translations: [],
                  currentPartOfSpeech: ""
                });
                
                
                dictionary.Body.forEach((bodyItem) => {
                  if (bodyItem.Node === "Paragraph") {
                    resultTranslation[index].transcription = Abbyy.getTranscription(bodyItem.Markup);
                    Abbyy.setPartOfSpeech(bodyItem.Markup, resultTranslation, index)
                    
                  } else if (bodyItem.Node === "List") {
                    Abbyy.processList(bodyItem, resultTranslation, index);
                  }
                })
              });
              
              resolve(resultTranslation);
              
            });
            response.on('error', (err) => reject(err));
          });
        });
      })
      .catch((err) => console.error(err));
  },
  
  processList(node, translationArr, index) {
    if (node.Type === 1 || node.Type === 2) {
      node.Items.forEach((listItem) => {
        if (listItem.Node === "ListItem") {
          Abbyy.processListItem(listItem, translationArr, index);
        }
      })
    } else if (node.Type === 3 || node.Type === 4) {
      node.Items.forEach((listItem) => {
        Abbyy.processListItem(listItem, translationArr, index);
      })
    }
  },
  
  processListItem(listItem, translationArr, index, nodeType) {
    listItem.Markup.forEach((item) => {
      if (item.Node === "Paragraph") {
        Abbyy.setPartOfSpeech(item.Markup, translationArr, index);
        Abbyy.processTextNode(item, translationArr, index, nodeType);
      } else if (item.Node === "List") {
        Abbyy.processList(item, translationArr, index);
      }
    });
  },
  
  processTextNode(item, translationArr, index) {
    if (item.hasOwnProperty("Markup")) {
      let variantPiece = "";
      let notes = "";
      let synonyms = "";
      /*TODO: process OR cut off antonyms!*/
      let isSynonymsBlock = false;
      let currentPartOfSpeech = translationArr[index].currentPartOfSpeech;
      
      item.Markup.forEach((textNode) => {
        if (textNode.Node === "CardRef") {
          isSynonymsBlock = true;
        }
        
        if (textNode.Node === "Abbrev") {
          let isPartOfSpeech = Abbyy.getPartOfSpeech(textNode.Text);
          if (textNode.Text && !isPartOfSpeech) {
            notes += textNode.Text;
          }
        }
        if (((textNode.Node === "Text") ) && !isSynonymsBlock) {
          if (textNode.Text && textNode.Text.trim() !== ";") {
            variantPiece += textNode.Text;
          }
        } else if (textNode.Node === "Comment" && !isSynonymsBlock) {
          textNode.Markup.forEach((comment) => {
            if (comment.Text) {
              variantPiece += comment.Text;
            }
          })
        }
        if (isSynonymsBlock) {
          synonyms += textNode.Text + " ";
        }
      });
      
      translationArr[index].translations.forEach((item) => {
        if (item.partOfSpeech === currentPartOfSpeech) {
          
          if (variantPiece) {
            notes = Abbyy.prettifyNotes(notes);
            item.variants.push({ notes, variant: variantPiece, synonyms });
          }
          if (synonyms) {
            synonyms = Abbyy.prettifySynonyms(synonyms);
            item.variants[item.variants.length - 1].synonyms = synonyms;
          }
        }
      });
    }
  },

  prettifyNotes(notes) {
    return notes.replace(/\.(?=[a-zA-ZА-Яа-я])/g,'. ').trim();
  },

  prettifySynonyms(synonyms) {
    return synonyms.replace(/[^A-Za-z0-9_\- ]+/g, " ")
      .replace(/\b(?=[MDCLXVI]+\b)M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})|([\d]+)\b/g, "")
      .trim()
      .replace(/[ ]{2,}/g, ", ")
  },
  
  processPartOfSpeech(node) {
    if (node.Node === "Abbrev") {
      return Abbyy.getPartOfSpeech(node.Text); /*TODO: use full text and change switch cases*/
    }
  },
  
  setPartOfSpeech(items, array, arrIndex) {
    for (let i = 0; i < items.length; i++) {
      let partOfSpeech = Abbyy.processPartOfSpeech(items[i]);
      if (partOfSpeech) {
        array[arrIndex].translations.push({ partOfSpeech, variants: [] });
        array[arrIndex].currentPartOfSpeech = partOfSpeech;
        break;
      }
    }
  },
  
  getTranscription(items) {
  
    let transcription = "";
    
    items.forEach((node) => {
      if (node.Node === "Transcription") {
        transcription = node.Text;
      }
    });
  
    return transcription;
  },
  
  getPartOfSpeech(abbrev) {
    
    let partOfSpeech = "";
    /*TODO: not all dictionaries have the same FullTexts for cases of partsOfSpeech so we need to create a multiple case*/
    switch (abbrev) {
      case "сущ." :
        partOfSpeech = "Noun";
        break;
      case "прил." :
        partOfSpeech = "Adjective";
        break;
      case "гл." :
        partOfSpeech = "Verb";
        break;
      case "нареч." :
        partOfSpeech = "Adverb";
        break;
      case "мест." :
        partOfSpeech = "Pronoun";
        break;
      case "предл." :
        partOfSpeech = "Preposition";
        break;
      case "союз" :
        partOfSpeech = "Conjunction";
        break;
      case "межд." :
        partOfSpeech = "Interjection";
        break;
      default :
        partOfSpeech = "";
    }
    
    return partOfSpeech;
  },
  
};

module.exports = Abbyy;
