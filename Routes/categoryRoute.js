const express = require('express');
const router = express.Router();
const {
    getAllCategoriesCtrl,
    getCategoryCtrl,
    createCategoryCtrl,
    updateCategoryCtrl,
    deleteCategoryCtrl
} = require("../Controllers/categoryController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Route publique : récupérer toutes les catégories (store frontend)
router.get("/public", getAllCategoriesCtrl);

// Toutes les routes : réservées à Admin + Store
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllCategoriesCtrl)
    .post(protect, requireAccess("admin", "store"), createCategoryCtrl);

router.route("/:id")
    .get(protect, requireAccess("admin", "store"), getCategoryCtrl)
    .put(protect, requireAccess("admin", "store"), updateCategoryCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteCategoryCtrl);

module.exports = router;
