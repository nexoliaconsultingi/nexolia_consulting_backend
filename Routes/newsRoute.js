const express = require('express');
const {
    createNewsCtrl,
    updateNewsCtrl,
    deleteNewsCtrl,
    getAllNewsCtrl,
    getOneNewsCtrl,
    getFeaturedNewsCtrl
} = require('../Controllers/newsController');

const router = express.Router();

// Routes publiques
router.route('/').get(getAllNewsCtrl);
router.route('/featured').get(getFeaturedNewsCtrl);
router.route('/:id').get(getOneNewsCtrl);

// Routes privées (nécessitent un token)
router.route('/').post(createNewsCtrl);
router.route('/:id').put(updateNewsCtrl);
router.route('/:id').delete(deleteNewsCtrl);

module.exports = router;