const express = require('express');
const router = express.Router();

const usersController = require('../controllers/usersController');

router.post('/api/users/create-user', usersController.createUser);

module.exports = router;
