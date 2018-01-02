const express = require('express');
const router = express.Router();

const associationsController = require('../controllers/associationsController');

router.post('/api/associations/find-associations', associationsController.findAssociations);
router.post('/api/associations/get-translation', associationsController.getTranslation);
router.post('/api/associations/get-audio', associationsController.getAudio);
router.post('/api/associations/save-association', associationsController.saveAssociation);
router.get('/api/associations/get-associations-list', associationsController.getAssociationList);
router.get('/api/associations/get-association-by-id', associationsController.getAssociationById);
router.delete('/api/associations/delete-association-by-id', associationsController.deleteAssociationById);
router.post('/api/associations/edit-association-variant', associationsController.editAssociationVariant);
router.post('/api/associations/edit-association-image', associationsController.editAssociationImage);
router.get('/api/associations/get-random-game-associations', associationsController.getRandomGameAssociations);

module.exports = router;
