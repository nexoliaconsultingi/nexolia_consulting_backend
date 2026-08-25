const asyncHandler = require("express-async-handler");
const { DiscountCode, createDiscountCodeVerify, updateDiscountCodeVerify } = require("../Models/discountCodeModel");
const { getSocket } = require("../socket");

// @desc    Récupérer tous les codes de remise
// @route   GET /store/api/discountcode
// @access  Admin + Store
module.exports.getAllDiscountCodesCtrl = asyncHandler(async (req, res) => {
    const codes = await DiscountCode.find()
        .populate("products", "identifier name salePrice images")
        .sort({ createdAt: -1 })
        .lean();
    res.status(200).json(codes);
});

// @desc    Créer un code de remise
// @route   POST /store/api/discountcode
// @access  Admin + Store
module.exports.createDiscountCodeCtrl = asyncHandler(async (req, res) => {
    const { error } = createDiscountCodeVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const existing = await DiscountCode.findOne({ code: req.body.code });
    if (existing) {
        return res.status(409).json({ message: "Ce code existe déjà" });
    }

    const created = await DiscountCode.create(req.body);
    const populated = await DiscountCode.findById(created._id)
        .populate("products", "identifier name salePrice images")
        .lean();
    getSocket()?.emitToStore('discountcodes:created', populated);
    res.status(201).json(populated);
});

// @desc    Mettre à jour un code de remise
// @route   PUT /store/api/discountcode/:id
// @access  Admin + Store
module.exports.updateDiscountCodeCtrl = asyncHandler(async (req, res) => {
    const { error } = updateDiscountCodeVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    if (req.body.code) {
        const existing = await DiscountCode.findOne({ code: req.body.code, _id: { $ne: req.params.id } });
        if (existing) {
            return res.status(409).json({ message: "Ce code existe déjà" });
        }
    }

    const updated = await DiscountCode.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .populate("products", "identifier name salePrice images")
        .lean();
    if (!updated) {
        return res.status(404).json({ message: "Code de remise non trouvé" });
    }
    getSocket()?.emitToStore('discountcodes:updated', updated);
    res.status(200).json(updated);
});

// @desc    Supprimer un code de remise
// @route   DELETE /store/api/discountcode/:id
// @access  Admin + Store
module.exports.deleteDiscountCodeCtrl = asyncHandler(async (req, res) => {
    const deleted = await DiscountCode.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
        return res.status(404).json({ message: "Code de remise non trouvé" });
    }
    getSocket()?.emitToStore('discountcodes:deleted', deleted);
    res.status(200).json({ message: "Code supprimé" });
});
