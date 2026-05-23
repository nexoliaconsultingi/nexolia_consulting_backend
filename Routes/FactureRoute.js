const express = require('express');
const { createFactureCtrl, deleteFactureCtrl, getAllFactureCtrl, updateFactureCtrl } = require('../Controllers/factureController');

const router = express.Router();

// Routes publiques
router.route('/:id').post(createFactureCtrl);
router.route('/:id').put(updateFactureCtrl);
router.route('/:id').delete(deleteFactureCtrl);
router.route('/').get(getAllFactureCtrl);





module.exports = router;