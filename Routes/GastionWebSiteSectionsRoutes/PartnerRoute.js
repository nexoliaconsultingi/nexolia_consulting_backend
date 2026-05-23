const express = require('express');
const {
  registerPartnerCtrl,
  updatePartnerCtrl,
  deletePartnerCtrl,
  readOnePartner,
  readAllPartners,
} = require('../../Controllers/GestionWebSiteSections/PartnersController.js');

const router = express.Router();

// Création
router.post('/register', registerPartnerCtrl);

// Lecture de tous les partenaires
router.get('/all', readAllPartners);

// Opérations sur un partenaire spécifique
router.get('/:id', readOnePartner);
router.put('/:id', updatePartnerCtrl);
router.delete('/:id', deletePartnerCtrl);

module.exports = router;