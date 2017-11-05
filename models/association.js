const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const associationSchema = new Schema({
  userFirstName: String,
  userLastName: String,
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    min: 6,
    max: 32,
  },
  
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
});

/**
 * @memberOf Association
 */
// associationSchema.statics.confirmPasswordEquality = function (pass, repeatedPass) {
//
//   return pass === repeatedPass;
// };

const Association = mongoose.model('Association', associationSchema);

module.exports = { Association };
