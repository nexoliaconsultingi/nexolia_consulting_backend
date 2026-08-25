const express = require('express');
const router = express.Router();
const {
    getAllDeliveryAgenciesCtrl,
    createDeliveryAgencyCtrl,
    updateDeliveryAgencyCtrl,
    deleteDeliveryAgencyCtrl
} = require("../Controllers/deliveryAgencyController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Routes réservées à Admin + Store (dashboard)
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllDeliveryAgenciesCtrl)
    .post(protect, requireAccess("admin", "store"), createDeliveryAgencyCtrl);

router.route("/:id")
    .put(protect, requireAccess("admin", "store"), updateDeliveryAgencyCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteDeliveryAgencyCtrl);

module.exports = router;
