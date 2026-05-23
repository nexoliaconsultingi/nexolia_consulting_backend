const express = require('express');
const {
    createGalleryCtrl,
    updateGalleryCtrl,
    deleteGalleryCtrl,
    getAllGalleriesCtrl,
    getOneGalleryCtrl
} = require('../../Controllers/GestionWebSiteSections/galleryController');

const router = express.Router();

// Routes publiques
router.route('/').get(getAllGalleriesCtrl);
router.route('/:id').get(getOneGalleryCtrl);

// Routes privées (nécessitent un token)
router.route('/').post(createGalleryCtrl);
router.route('/:id').put(updateGalleryCtrl);
router.route('/:id').delete(deleteGalleryCtrl);

module.exports = router;