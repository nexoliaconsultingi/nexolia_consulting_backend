const express = require('express');
const router = express.Router();
const {
    getAllFournisseursCtrl,
    getFournisseurCtrl,
    createFournisseurCtrl,
    updateFournisseurCtrl,
    deleteFournisseurCtrl
} = require("../Controllers/fournisseurController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Toutes les routes : réservées à Admin + Store
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllFournisseursCtrl)
    .post(protect, requireAccess("admin", "store"), createFournisseurCtrl);

router.route("/:id")
    .get(protect, requireAccess("admin", "store"), getFournisseurCtrl)
    .put(protect, requireAccess("admin", "store"), updateFournisseurCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteFournisseurCtrl);

module.exports = router;
