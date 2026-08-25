const asyncHandler = require("express-async-handler");
const { Depot, createDepotVerify, updateDepotVerify } = require("../Models/depotModel");
const { Zone } = require("../Models/zoneModel");
const { getSocket } = require("../socket");

// @desc    Récupérer tous les dépôts
// @route   GET /store/api/depot
// @access  Admin + Store
module.exports.getAllDepotsCtrl = asyncHandler(async (req, res) => {
    const depots = await Depot.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(depots);
});

// @desc    Récupérer un dépôt par son id
// @route   GET /store/api/depot/:id
// @access  Admin + Store
module.exports.getDepotCtrl = asyncHandler(async (req, res) => {
    const depot = await Depot.findById(req.params.id).lean();
    if (!depot) {
        return res.status(404).json({ message: "Depot not found" });
    }
    res.status(200).json(depot);
});

// @desc    Créer un dépôt
// @route   POST /store/api/depot
// @access  Admin + Store
module.exports.createDepotCtrl = asyncHandler(async (req, res) => {
    const { error } = createDepotVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    // L'identifiant doit être unique
    const existing = await Depot.findOne({
        identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
    });
    if (existing) {
        return res.status(400).json({ message: "Cet identifiant de dépôt existe déjà" });
    }
    const depot = await Depot.create({
        identifier: req.body.identifier,
        name: req.body.name,
        address: req.body.address,
        area: req.body.area ?? 0,
        status: req.body.status ?? 'inactive',
        responsableName: req.body.responsableName || '',
        responsableEmail: req.body.responsableEmail || '',
        responsablePhone: req.body.responsablePhone || ''
    });
    // Temps réel : tous les utilisateurs admin + store voient le nouveau dépôt
    getSocket()?.emitToStore('depots:created', depot);
    res.status(201).json(depot);
});

// @desc    Modifier un dépôt
// @route   PUT /store/api/depot/:id
// @access  Admin + Store
module.exports.updateDepotCtrl = asyncHandler(async (req, res) => {
    const { error } = updateDepotVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    if (req.body.identifier !== undefined) {
        const existing = await Depot.findOne({
            _id: { $ne: req.params.id },
            identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(400).json({ message: "Cet identifiant de dépôt existe déjà" });
        }
    }
    const updateData = {};
    if (req.body.identifier !== undefined) updateData.identifier = req.body.identifier;
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.area !== undefined) updateData.area = req.body.area;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.responsableName !== undefined) updateData.responsableName = req.body.responsableName;
    if (req.body.responsableEmail !== undefined) updateData.responsableEmail = req.body.responsableEmail;
    if (req.body.responsablePhone !== undefined) updateData.responsablePhone = req.body.responsablePhone;

    const depot = await Depot.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!depot) {
        return res.status(404).json({ message: "Depot not found" });
    }
    // Temps réel : admin + store voient la modification sans recharger
    getSocket()?.emitToStore('depots:updated', depot);
    res.status(200).json(depot);
});

// @desc    Supprimer un dépôt
// @route   DELETE /store/api/depot/:id
// @access  Admin + Store
module.exports.deleteDepotCtrl = asyncHandler(async (req, res) => {
    const depot = await Depot.findByIdAndDelete(req.params.id);
    if (!depot) {
        return res.status(404).json({ message: "Depot not found" });
    }
    // Supprime aussi les zones de ce dépôt
    await Zone.deleteMany({ depotId: req.params.id });
    // Temps réel : admin + store voient la suppression sans recharger
    getSocket()?.emitToStore('depots:deleted', { id: req.params.id });
    getSocket()?.emitToStore('zones:deleted', { id: null, depotId: req.params.id });
    res.status(200).json({ message: "Depot deleted successfully" });
});
