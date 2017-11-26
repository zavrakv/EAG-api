const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { associationSchema } = require('./association');

const userSchema = new Schema({
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
  associations: [associationSchema],
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
});

/**
 * @memberOf User
 */
userSchema.statics.confirmPasswordEquality = function (pass, repeatedPass) {
  
  return pass === repeatedPass;
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
