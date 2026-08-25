const express = require('express');
const router = express.Router();
const {
    getAllGiftsCtrl,
    getGiftCtrl,
    createGiftCtrl,
    updateGiftCtrl,
    deleteGiftCtrl,
    setGiftWinnerCtrl,
    clearGiftWinnerCtrl
} = require("../Controllers/giftController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Route publique : cadeaux publiés pour le store
router.get("/public", async (req, res) => {
    try {
        const { Gift } = require("../Models/giftModel");
        const gifts = await Gift.find({ published: true }).sort({ createdAt: -1 }).lean();
        res.status(200).json(gifts);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Toutes les routes : réservées à Admin + Store
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllGiftsCtrl)
    .post(protect, requireAccess("admin", "store"), createGiftCtrl);

router.route("/:id")
    .get(protect, requireAccess("admin", "store"), getGiftCtrl)
    .put(protect, requireAccess("admin", "store"), updateGiftCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteGiftCtrl);

router.route("/:id/winner")
    .put(protect, requireAccess("admin", "store"), setGiftWinnerCtrl)
    .delete(protect, requireAccess("admin", "store"), clearGiftWinnerCtrl);

module.exports = router;
