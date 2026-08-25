const express = require('express');
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { DiscountCode } = require("../Models/discountCodeModel");
const {
    getAllDiscountCodesCtrl,
    createDiscountCodeCtrl,
    updateDiscountCodeCtrl,
    deleteDiscountCodeCtrl
} = require("../Controllers/discountCodeController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Route publique : valider un code de remise (pour le store client)
router.get("/validate/:code", asyncHandler(async (req, res) => {
    const code = await DiscountCode.findOne({ code: req.params.code.toUpperCase(), active: true }).lean();
    if (!code) {
        return res.status(404).json({ valid: false, message: "Code invalide" });
    }
    if (code.maxUsage > 0 && code.usageCount >= code.maxUsage) {
        return res.status(400).json({ valid: false, message: "Ce code a atteint sa limite d'utilisation" });
    }
    res.status(200).json({
        valid: true,
        percentage: code.percentage,
        productIds: code.products.map(p => p.toString()),
    });
}));

// Toutes les routes ci-dessous : réservées à Admin + Store
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllDiscountCodesCtrl)
    .post(protect, requireAccess("admin", "store"), createDiscountCodeCtrl);

router.route("/:id")
    .put(protect, requireAccess("admin", "store"), updateDiscountCodeCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteDiscountCodeCtrl);

module.exports = router;
