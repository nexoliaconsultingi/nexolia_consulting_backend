const express = require('express');
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { Product } = require("../Models/productModel");
const {
    getAllProductsCtrl,
    getProductCtrl,
    createProductCtrl,
    updateProductCtrl,
    deleteProductCtrl
} = require("../Controllers/productController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Route publique : liste des produits (pour le store, sans auth)
router.get("/public", asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.bestSeller === 'true') filter.bestSeller = true;
    if (req.query.newArrival === 'true') filter.newArrival = true;
    if (req.query.trending === 'true') filter.trending = true;
    if (req.query.onPromotion === 'true') filter.onPromotion = true;

    const products = await Product.find(filter)
        .populate("categoryId", "identifier name")
        .sort({ createdAt: -1 })
        .lean();
    res.status(200).json(products);
}));

// Route publique : produit par ID (pour la page détail store)
router.get("/public/:id", asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate("categoryId", "identifier name")
        .lean();
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
}));

// Toutes les routes ci-dessous : réservées à Admin + Store
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllProductsCtrl)
    .post(protect, requireAccess("admin", "store"), createProductCtrl);

router.route("/:id")
    .get(protect, requireAccess("admin", "store"), getProductCtrl)
    .put(protect, requireAccess("admin", "store"), updateProductCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteProductCtrl);

module.exports = router;
