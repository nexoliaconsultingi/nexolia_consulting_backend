const express = require('express');
const {
  registerVideoCtrl,
  updateVideoCtrl,
  deleteVideoCtrl,
  readOneVideo,
  readAllVideos,
} = require('../../Controllers/GestionWebSiteSections/VideoController.js');

const router = express.Router();

router.post('/register', registerVideoCtrl);
router.get('/all', readAllVideos);
router.get('/:id', readOneVideo);
router.put('/:id', updateVideoCtrl);

router.delete('/:id', deleteVideoCtrl);

module.exports = router;