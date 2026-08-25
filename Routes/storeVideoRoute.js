const express = require('express');
const router = express.Router();
const {
    getStoreVideosPublicCtrl,
    getAllStoreVideosCtrl,
    createStoreVideoCtrl,
    updateStoreVideoCtrl,
    deleteStoreVideoCtrl
} = require("../Controllers/storeVideoController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Route publique : vidéos visibles sur le site de Nexolia (store)
router.get("/", getStoreVideosPublicCtrl);

// Routes protégées : réservées à Admin + Store
router.get("/admin", protect, requireAccess("admin", "store"), getAllStoreVideosCtrl);
router.post("/", protect, requireAccess("admin", "store"), createStoreVideoCtrl);
router.put("/:id", protect, requireAccess("admin", "store"), updateStoreVideoCtrl);
router.delete("/:id", protect, requireAccess("admin", "store"), deleteStoreVideoCtrl);

module.exports = router;
