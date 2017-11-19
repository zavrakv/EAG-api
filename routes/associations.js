const express = require('express');
const router = express.Router();

const associationsController = require('../controllers/associationsController');

router.post('/api/associations/find-associations', associationsController.findAssociations);
router.post('/api/associations/get-translation', associationsController.getTranslation);
router.post('/api/associations/get-audio', associationsController.getAudio);

module.exports = router;
