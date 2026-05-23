const express = require('express');
const {
  registerServiceCtrl,
  updateServiceCtrl,
  deleteServiceCtrl,
  readOneService,
  readAllServices,
} = require('../../Controllers/GestionWebSiteSections/ServiceController');

const router = express.Router();

router.post('/register', registerServiceCtrl);
router.get('/all', readAllServices);
router.get('/:id', readOneService);
router.put('/:id', updateServiceCtrl);
router.delete('/:id', deleteServiceCtrl);

module.exports = router;