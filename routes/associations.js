const express = require('express');
const router = express.Router();

const associationsController = require('../controllers/associationsController');

router.post('/api/associations/find-associations', associationsController.findAssociations);
router.post('/api/associations/get-translation', associationsController.getTranslation);
router.post('/api/associations/get-audio', associationsController.getAudio);
router.post('/api/associations/save-association', associationsController.saveAssociation);
router.get('/api/associations/get-associations-list', associationsController.getAssociationList);

module.exports = router;
