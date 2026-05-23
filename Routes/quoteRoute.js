const express = require('express');
const {
  createQuoteCtrl,
  getAllQuotesCtrl,
  getOneQuoteCtrl,
  updateQuoteCtrl,
  deleteQuoteCtrl,
  changeQuoteStatusCtrl,
  getAllValidatedQuotesSimpleCtrl,
  getQuoteStatsCtrl,
  updateGoToFacturation
} = require('../Controllers/quoteController');

const router = express.Router();

// Route publique
router.post('/', createQuoteCtrl);

// Routes protégées (admin)
router.get('/stats', getQuoteStatsCtrl);
router.get('/validated', getAllValidatedQuotesSimpleCtrl);  // <-- À METTRE ICI, AVANT /:id
router.get('/', getAllQuotesCtrl);
router.get('/:id', getOneQuoteCtrl);  // <-- Les routes avec paramètres dynamiques APRÈS les routes spécifiques
router.put('/:id', updateQuoteCtrl);
router.patch('/:id/status', changeQuoteStatusCtrl);
router.delete('/:id', deleteQuoteCtrl);
router.put('/:id/facturation', updateGoToFacturation);


module.exports = router;