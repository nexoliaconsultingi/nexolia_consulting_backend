// Routes/GestionWebSiteSections/ReviewRoute.js
const express = require('express');
const {
  registerReviewCtrl,
  updateReviewCtrl,
  deleteReviewCtrl,
  readOneReview,
  readAllReviews,
  readValidatedReviews,
} = require('../../Controllers/GestionWebSiteSections/ReviewController');

const router = express.Router();

// Routes publiques
router.post('/register', registerReviewCtrl); // création d'un avis (public)
router.get('/validated', readValidatedReviews); // liste des avis validés (public)

// Routes privées (admin) - à protéger avec un middleware d'authentification
router.get('/all', readAllReviews);
router.get('/:id', readOneReview);
router.put('/:id', updateReviewCtrl);
router.delete('/:id', deleteReviewCtrl);

module.exports = router;