const express = require('express');
const router = express.Router();
const {
    searchClientsCtrl,
    createClientCtrl
} = require("../Controllers/clientController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Réservé à Admin + Store
router.route("/")
    .get(protect, requireAccess("admin", "store"), searchClientsCtrl)
    .post(protect, requireAccess("admin", "store"), createClientCtrl);

module.exports = router;
