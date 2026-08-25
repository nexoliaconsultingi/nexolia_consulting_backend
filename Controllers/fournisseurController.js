const asyncHandler = require("express-async-handler");
const { Fournisseur, createFournisseurVerify, updateFournisseurVerify } = require("../Models/fournisseurModel");
const { getSocket } = require("../socket");

// @desc    Récupérer tous les fournisseurs
// @route   GET /store/api/fournisseur
// @access  Admin + Store
module.exports.getAllFournisseursCtrl = asyncHandler(async (req, res) => {
    const fournisseurs = await Fournisseur.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(fournisseurs);
});

// @desc    Récupérer un fournisseur par son id
// @route   GET /store/api/fournisseur/:id
// @access  Admin + Store
module.exports.getFournisseurCtrl = asyncHandler(async (req, res) => {
    const fournisseur = await Fournisseur.findById(req.params.id).lean();
    if (!fournisseur) {
        return res.status(404).json({ message: "Fournisseur not found" });
    }
    res.status(200).json(fournisseur);
});

// @desc    Créer un fournisseur
// @route   POST /store/api/fournisseur
// @access  Admin + Store
module.exports.createFournisseurCtrl = asyncHandler(async (req, res) => {
    const { error } = createFournisseurVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const fournisseur = await Fournisseur.create({
        name: req.body.name,
        address: req.body.address,
        description: req.body.description || '',
        email: req.body.email,
        phone: req.body.phone || '',
        active: req.body.active ?? false,
        turnover: req.body.turnover ?? 0
    });
    // Temps réel : tous les utilisateurs admin + store voient le nouveau fournisseur
    getSocket()?.emitToStore('fournisseurs:created', fournisseur);
    res.status(201).json(fournisseur);
});

// @desc    Modifier un fournisseur
// @route   PUT /store/api/fournisseur/:id
// @access  Admin + Store
module.exports.updateFournisseurCtrl = asyncHandler(async (req, res) => {
    const { error } = updateFournisseurVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.active !== undefined) updateData.active = req.body.active;
    if (req.body.turnover !== undefined) updateData.turnover = req.body.turnover;

    const fournisseur = await Fournisseur.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!fournisseur) {
        return res.status(404).json({ message: "Fournisseur not found" });
    }
    // Temps réel : admin + store voient la modification sans recharger
    getSocket()?.emitToStore('fournisseurs:updated', fournisseur);
    res.status(200).json(fournisseur);
});

// @desc    Supprimer un fournisseur
// @route   DELETE /store/api/fournisseur/:id
// @access  Admin + Store
module.exports.deleteFournisseurCtrl = asyncHandler(async (req, res) => {
    const fournisseur = await Fournisseur.findByIdAndDelete(req.params.id);
    if (!fournisseur) {
        return res.status(404).json({ message: "Fournisseur not found" });
    }
    // Temps réel : admin + store voient la suppression sans recharger
    getSocket()?.emitToStore('fournisseurs:deleted', { id: req.params.id });
    res.status(200).json({ message: "Fournisseur deleted successfully" });
});
