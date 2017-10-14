const { User } = require('../models/user');
const bcrypt = require('bcrypt');

const user = {
  
  generateSalt: (password) => {
    const saltRounds = 8;
    
    return new Promise((resolve) => {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        resolve(hash);
      });
    });
  },
  
  createUser(req, response) {
    const userPassConfirm = User.confirmPasswordEquality(req.body.password, req.body.repeatedPassword);
    
    if (!userPassConfirm) {
      response.send({ statusCode: 400, message:`Passwords are not identical!` });
      return;
    }
  
    user.generateSalt(req.body.password).then((hash) => {
      
      req.body.password = hash;
      
      User.create(req.body)
        .then((user) => {
          response.send({ statusCode: 200, message: `User with email: ${user.email} was successfully created!` });
        })
        .catch(() => {
          response.send({ statusCode: 400, message: 'User with this email already exists!' });
        });
    });
  }
    
};

module.exports = user;
