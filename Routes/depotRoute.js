const express = require('express');
const router = express.Router();
const {
    getAllDepotsCtrl,
    getDepotCtrl,
    createDepotCtrl,
    updateDepotCtrl,
    deleteDepotCtrl
} = require("../Controllers/depotController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Toutes les routes : réservées à Admin + Store
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllDepotsCtrl)
    .post(protect, requireAccess("admin", "store"), createDepotCtrl);

router.route("/:id")
    .get(protect, requireAccess("admin", "store"), getDepotCtrl)
    .put(protect, requireAccess("admin", "store"), updateDepotCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteDepotCtrl);

module.exports = router;
