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
              
              let partOfSpeech = "";
              
              Translations.forEach((dictionary, index) => {
                
                resultTranslation.push({
                  dictionary: dictionary.Dictionary,
                  transcription: "",
                  soundArr: [],
                  translations: []
                });
                
                
                dictionary.Body.forEach((bodyItem) => {
                  
                  if (bodyItem.Node === "Paragraph") {
                    bodyItem.Markup.forEach((node) => {
                      if (node.Node === "Transcription") {
                        resultTranslation[index].transcription = node.Text;
                      } else if (node.Node === "Sound") {
                        resultTranslation[index].soundArr.push(node.FileName)
                      } else if (node.Node === "Abbrev") {
                        let extractedPartOfSpeech = Abbyy.getPartOfSpeech(node.Text);
                        if (extractedPartOfSpeech) {
                          partOfSpeech = extractedPartOfSpeech;
                          resultTranslation[index].translations.push({partOfSpeech, variants: []})
                        }
                      }
                    })
                  } else if (bodyItem.Node === "List") {
                    let bodyItemNodeType = bodyItem.Type;
                    bodyItem.Items.forEach((listItem) => {
                      if (listItem.Node === "ListItem") {
                        listItem.Markup.forEach((nodeItem, nodeIndex) => {
                          if (nodeItem.Node === "Paragraph") {
                            nodeItem.Markup.forEach((paragraphItem) => {
                              
                              // console.log();
                              // console.log(nodeIndex > 0);
                              // console.log("-----");
                              
                              if (paragraphItem.Node === "Abbrev") {
                                let extractedPartOfSpeech = Abbyy.getPartOfSpeech(paragraphItem.Text);
                                if (extractedPartOfSpeech) {
                                  partOfSpeech = extractedPartOfSpeech;
                                  resultTranslation[index].translations.push({partOfSpeech, variants: []})
                                }
                              }
                              if (nodeIndex > 0 || bodyItemNodeType === 3) {
                                if (paragraphItem.Node !== "Abbrev") {
                                  resultTranslation[index].translations.forEach((translation) => {
                                    if (translation.partOfSpeech === partOfSpeech) {
                                      translation.variants.push(paragraphItem.Text)
                                    }
                                  })
                                }
                                
                              }
                            })
                          } else if (nodeItem.Node === "List") {
                            let NodeType = nodeItem.Type;
                            nodeItem.Items.forEach((listItem) => {
                              
                              if (listItem.Node === "ListItem") {
                                let isSynonymBlock = false;
                                let variant = "";
                                let prefix = "";
                                let synonyms = [];
                                listItem.Markup.forEach((markupItem) => {
                                  if (markupItem.Node === "Caption") {
                                    isSynonymBlock = true;
                                  }
                                  
                                  if (markupItem.Node === "Paragraph") {
                                    markupItem.Markup.forEach((paragraphItem) => {
                                      
                                      if (paragraphItem.Node === "Comment") {
                                        paragraphItem.Markup.forEach((comment) => {
                                          variant += comment.Text;
                                        })
                                      }
                                      
                                      if (paragraphItem.Node === "Abbrev") {
                                        paragraphItem.Text += "||";
                                      }
                                      
                                      if (paragraphItem.Text !== null && paragraphItem.Node !== "CardRef" && !isSynonymBlock) {
                                        // if (NodeType === 3) {
                                        //  variant += paragraphItem.Text;
                                        // } else if (NodeType === 4) {
                                        //  variant += paragraphItem.Text;
                                        // }
                                        variant += paragraphItem.Text;
                                      }
                                      if (paragraphItem.Node === "CardRef") {
                                        synonyms.push(paragraphItem.Text);
                                      }
                                      
                                      
                                    });
                                    resultTranslation[index].translations.forEach((translation) => {
                                      if (translation.partOfSpeech === partOfSpeech && !isSynonymBlock) {
                                        
                                        let pipeIndex = variant.lastIndexOf("||");
                                        
                                        if (pipeIndex > 0) {
                                          
                                          prefix = variant.slice(0, pipeIndex);
                                          prefix = prefix.replace(/\|\|/g, "");
                                          variant = variant.slice(pipeIndex + 2)
                                        }
                                        
                                        translation.variants.push({
                                          prefix: prefix,
                                          variant: variant,
                                          synonyms: []
                                        });
                                      } else if (translation.partOfSpeech === partOfSpeech && isSynonymBlock) {
                                        translation.variants[translation.variants.length - 1].synonyms.push(synonyms);
                                      }
                                    });
                                  } else if (markupItem.Node === "List") {
                                    markupItem.Items.forEach((listItem) => {
                                      if (listItem.Node === "ListItem") {
                                        let isSynonymBlock = false;
                                        let variant = "";
                                        let prefix = "";
                                        let synonyms = [];
                                        listItem.Markup.forEach((markupItem) => {
                                          
                                          if (markupItem.Node === "Caption") {
                                            isSynonymBlock = true;
                                          }
                                          
                                          if (markupItem.Node === "Paragraph") {
                                            
                                            markupItem.Markup.forEach((paragraphItem) => {
                                              if (paragraphItem.Node === "Comment") {
                                                paragraphItem.Markup.forEach((comment) => {
                                                  variant += comment.Text;
                                                })
                                              }
                                              
                                              if (paragraphItem.Node === "Abbrev") {
                                                paragraphItem.Text += "||";
                                              }
                                              
                                              if (paragraphItem.Text !== null && paragraphItem.Node !== "CardRef" && !isSynonymBlock) {
                                                
                                                variant += paragraphItem.Text;
                                                // if (NodeType === 3) {
                                                //  variant += paragraphItem.Text;
                                                // } else if (NodeType === 4) {
                                                //  variant += paragraphItem.Text;
                                                // } else if (NodeType === 2) {
                                                //  variant += paragraphItem.Text;
                                                // }
                                              }
                                              if (paragraphItem.Node === "CardRef") {
                                                synonyms.push(paragraphItem.Text);
                                              }
                                              
                                            });
                                            
                                            console.log(resultTranslation[index].translations);
                                            resultTranslation[index].translations.forEach((translation) => {
                                              console.log(!isSynonymBlock)
                                              if (translation.partOfSpeech === partOfSpeech && !isSynonymBlock) {
                                                
                                                let pipeIndex = variant.lastIndexOf("||");
                                                
                                                if (pipeIndex > 0) {
                                                  
                                                  prefix = variant.slice(0, pipeIndex);
                                                  prefix = prefix.replace(/\|\|/g, "");
                                                  variant = variant.slice(pipeIndex + 2)
                                                }
                                                
                                                translation.variants.push({
                                                  prefix: prefix,
                                                  variant: variant,
                                                  synonyms: []
                                                });
                                              } else if (translation.partOfSpeech === partOfSpeech && isSynonymBlock) {
                                                translation.variants[translation.variants.length - 1].synonyms.push(synonyms);
                                              }
                                            });
                                          }
                                        })
                                      }
                                    })
                                  }
                                })
                              }
                            })
                          }
                        })
                      }
                    })
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
  
  getPartOfSpeech(abbrev) {
    
    let partOfSpeech = "";
    
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
