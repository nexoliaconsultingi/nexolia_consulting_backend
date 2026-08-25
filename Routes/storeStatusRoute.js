const express = require('express');
const router = express.Router();
const {
    getStoreStatusCtrl,
    updateStoreStatusCtrl
} = require("../Controllers/storeStatusController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Route publique : statut de la store (pas d'auth)
router.get("/", getStoreStatusCtrl);

// Route protégée : mettre à jour le statut (admin + store)
router.put("/", protect, requireAccess("admin", "store"), updateStoreStatusCtrl);

module.exports = router;
