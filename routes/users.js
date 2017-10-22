const express = require('express');
const router = express.Router();

const usersController = require('../controllers/usersController');

router.post('/api/users/create-user', usersController.createUser);
router.post('/api/users/login-user', usersController.loginUser);

module.exports = router;
