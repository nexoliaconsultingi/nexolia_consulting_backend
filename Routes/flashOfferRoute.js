const express = require('express');
const router = express.Router();
const {
    getAllFlashOffersCtrl,
    getFlashOfferCtrl,
    createFlashOfferCtrl,
    startFlashOfferCtrl,
    updateFlashOfferCtrl,
    deleteFlashOfferCtrl
} = require("../Controllers/flashOfferController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Route publique : récupérer les offres flash actives (store frontend)
router.get("/public", getAllFlashOffersCtrl);

// Toutes les routes : réservées à Admin + Store
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllFlashOffersCtrl)
    .post(protect, requireAccess("admin", "store"), createFlashOfferCtrl);

router.post("/:id/start", protect, requireAccess("admin", "store"), startFlashOfferCtrl);

router.route("/:id")
    .get(protect, requireAccess("admin", "store"), getFlashOfferCtrl)
    .put(protect, requireAccess("admin", "store"), updateFlashOfferCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteFlashOfferCtrl);

module.exports = router;
