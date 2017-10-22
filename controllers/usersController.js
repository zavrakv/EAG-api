const { User } = require('../models/user');
const bcrypt = require('bcrypt');
const env = process.env.NODE_ENV;
const config = require('../config/config.json')[env];
const jwt = require('jsonwebtoken');

const user = {
  
  generateSalt: (password) => {
    const saltRounds = 8;
    
    return new Promise((resolve) => {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        resolve(hash);
      });
    });
  },
  
  generateToken: (_id) => {
    const JWT_SECRET = config.JWT_SECRET;
    return jwt.sign({
      data: _id,
    }, JWT_SECRET);
  },
  
  checkPassword: (password, hash) => new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      res ? resolve(res) :
        reject('invalid password');
    });
  }),
  
  createUser(req, response) {
    const userPassConfirm = User.confirmPasswordEquality(req.body.password, req.body.confirmPassword);
    
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
  },
  
  loginUser(req, response) {
    User.findOne({
      email: req.body.email
    }).then((person) => {
      user.checkPassword(req.body.password, person.password)
        .then(() => {
          const token = user.generateToken(person._id);
          response.set({ Authorization: `Bearer ${token}` }).send({ message: 'Welcome', _id: person._id });
        })
        .catch((err) => {
          response.send({ status: 400, message: err });
        });
    })
    .catch(() => {
      response.send({ status: 400, message: 'No user found' });
    });
  }
    
};

module.exports = user;
