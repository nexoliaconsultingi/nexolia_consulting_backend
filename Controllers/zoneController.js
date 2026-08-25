const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { Zone, createZoneVerify, updateZoneVerify } = require("../Models/zoneModel");
const { Depot } = require("../Models/depotModel");
const { getSocket } = require("../socket");

// @desc    Récupérer toutes les zones
// @route   GET /store/api/zone
// @access  Admin + Store
module.exports.getAllZonesCtrl = asyncHandler(async (req, res) => {
    const zones = await Zone.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(zones);
});

// @desc    Récupérer les zones d'un dépôt
// @route   GET /store/api/zone/depot/:depotId
// @access  Admin + Store
module.exports.getZonesByDepotCtrl = asyncHandler(async (req, res) => {
    const zones = await Zone.find({ depotId: req.params.depotId }).sort({ createdAt: -1 }).lean();
    res.status(200).json(zones);
});

// @desc    Récupérer une zone par son id
// @route   GET /store/api/zone/:id
// @access  Admin + Store
module.exports.getZoneCtrl = asyncHandler(async (req, res) => {
    const zone = await Zone.findById(req.params.id).lean();
    if (!zone) {
        return res.status(404).json({ message: "Zone not found" });
    }
    res.status(200).json(zone);
});

// @desc    Créer une zone de stockage
// @route   POST /store/api/zone
// @access  Admin + Store
module.exports.createZoneCtrl = asyncHandler(async (req, res) => {
    const { error } = createZoneVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    if (!mongoose.Types.ObjectId.isValid(req.body.depotId)) {
        return res.status(400).json({ message: "Dépôt invalide" });
    }
    const depot = await Depot.findById(req.body.depotId);
    if (!depot) {
        return res.status(404).json({ message: "Dépôt introuvable" });
    }
    const existing = await Zone.findOne({
        depotId: req.body.depotId,
        identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
    });
    if (existing) {
        return res.status(400).json({ message: "Cet identifiant de zone existe déjà dans ce dépôt" });
    }
    const zone = await Zone.create({
        depotId: req.body.depotId,
        identifier: req.body.identifier,
        name: req.body.name,
        storageType: req.body.storageType ?? 'rack',
        area: req.body.area ?? 0,
        hasProducts: req.body.hasProducts ?? false,
        productType: req.body.productType || '',
        storageUnit: req.body.storageUnit ?? 'piece'
    });
    // Temps réel : admin + store voient la nouvelle zone sans recharger
    getSocket()?.emitToStore('zones:created', zone);
    res.status(201).json(zone);
});

// @desc    Modifier une zone
// @route   PUT /store/api/zone/:id
// @access  Admin + Store
module.exports.updateZoneCtrl = asyncHandler(async (req, res) => {
    const { error } = updateZoneVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    if (req.body.identifier !== undefined) {
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: "Zone not found" });
        }
        const existing = await Zone.findOne({
            _id: { $ne: req.params.id },
            depotId: zone.depotId,
            identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(400).json({ message: "Cet identifiant de zone existe déjà dans ce dépôt" });
        }
    }
    const updateData = {};
    if (req.body.identifier !== undefined) updateData.identifier = req.body.identifier;
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.storageType !== undefined) updateData.storageType = req.body.storageType;
    if (req.body.area !== undefined) updateData.area = req.body.area;
    if (req.body.hasProducts !== undefined) updateData.hasProducts = req.body.hasProducts;
    if (req.body.productType !== undefined) updateData.productType = req.body.productType;
    if (req.body.storageUnit !== undefined) updateData.storageUnit = req.body.storageUnit;

    const updated = await Zone.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updated) {
        return res.status(404).json({ message: "Zone not found" });
    }
    // Temps réel : admin + store voient la modification sans recharger
    getSocket()?.emitToStore('zones:updated', updated);
    res.status(200).json(updated);
});

// @desc    Supprimer une zone
// @route   DELETE /store/api/zone/:id
// @access  Admin + Store
module.exports.deleteZoneCtrl = asyncHandler(async (req, res) => {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
        return res.status(404).json({ message: "Zone not found" });
    }
    // Temps réel : admin + store voient la suppression sans recharger
    getSocket()?.emitToStore('zones:deleted', { id: req.params.id, depotId: zone.depotId });
    res.status(200).json({ message: "Zone deleted successfully" });
});
