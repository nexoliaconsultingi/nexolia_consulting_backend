const express = require('express');
const router = express.Router();
const {
    getAllZonesCtrl,
    getZonesByDepotCtrl,
    getZoneCtrl,
    createZoneCtrl,
    updateZoneCtrl,
    deleteZoneCtrl
} = require("../Controllers/zoneController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Toutes les routes : réservées à Admin + Store
router.get("/depot/:depotId", protect, requireAccess("admin", "store"), getZonesByDepotCtrl);

router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllZonesCtrl)
    .post(protect, requireAccess("admin", "store"), createZoneCtrl);

router.route("/:id")
    .get(protect, requireAccess("admin", "store"), getZoneCtrl)
    .put(protect, requireAccess("admin", "store"), updateZoneCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteZoneCtrl);

module.exports = router;
