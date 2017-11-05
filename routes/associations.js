const express = require('express');
const router = express.Router();

const associationsController = require('../controllers/associationsController');

router.post('/api/associations/find-associations', associationsController.findAssociations);

module.exports = router;
