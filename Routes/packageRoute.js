const express = require('express');
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { Package } = require("../Models/packageModel");
const {
    getAllPackagesCtrl,
    getPackageCtrl,
    createPackageCtrl,
    updatePackageCtrl,
    deletePackageCtrl
} = require("../Controllers/packageController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

const PACKAGE_POPULATE = {
    path: 'products.productId',
    select: 'identifier name unit salePrice promoPrice onPromotion images'
};

// Route publique : tous les packages actifs (pour le store, sans auth)
router.get("/public", asyncHandler(async (req, res) => {
    const packages = await Package.find({ active: true })
        .populate(PACKAGE_POPULATE)
        .sort({ createdAt: -1 })
        .lean();
    res.status(200).json(packages);
}));

// Toutes les routes ci-dessous : réservées à Admin + Store
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllPackagesCtrl)
    .post(protect, requireAccess("admin", "store"), createPackageCtrl);

router.route("/:id")
    .get(protect, requireAccess("admin", "store"), getPackageCtrl)
    .put(protect, requireAccess("admin", "store"), updatePackageCtrl)
    .delete(protect, requireAccess("admin", "store"), deletePackageCtrl);

module.exports = router;
