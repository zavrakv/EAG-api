const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const associationSchema = new Schema({
  originalWord: String,
  translation: String,
  transcription: String,
  dictionary: String,
  soundArr: Array,
  imgUrl: String,
  notes: String,
  partOfSpeech: String,
  synonyms: String, /*TODO: maybe we should split this with comma to array? for synonyms learning mode*/
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
});

/**
 * @memberOf Association
 */
associationSchema.statics.isNotUniqueAssociation = function (candidateVariant, variant) {
  return candidateVariant === variant;
};

const Association = mongoose.model('Association', associationSchema);

module.exports = { associationSchema, Association };
