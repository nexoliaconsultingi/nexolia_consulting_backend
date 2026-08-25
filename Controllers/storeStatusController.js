const asyncHandler = require("express-async-handler");
const { StoreStatus, updateStoreStatusVerify } = require("../Models/storeStatusModel");
const { getSocket } = require("../socket");

// @desc    Récupérer le statut de la store (publique, sans auth)
// @route   GET /store/api/status
// @access  Public
module.exports.getStoreStatusCtrl = asyncHandler(async (req, res) => {
    let status = await StoreStatus.findOne().lean();
    if (!status) {
        status = await StoreStatus.create({ isActive: true });
        status = status.toObject();
    }
    res.status(200).json({ isActive: status.isActive, maintenanceMessage: status.maintenanceMessage });
});

// @desc    Mettre à jour le statut de la store
// @route   PUT /store/api/status
// @access  Admin + Store
module.exports.updateStoreStatusCtrl = asyncHandler(async (req, res) => {
    const { error } = updateStoreStatusVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    let status = await StoreStatus.findOne();
    if (!status) {
        status = new StoreStatus({ isActive: true });
    }

    if (req.body.isActive !== undefined) status.isActive = req.body.isActive;
    if (req.body.maintenanceMessage !== undefined) status.maintenanceMessage = req.body.maintenanceMessage.trim();

    await status.save();

    // Émettre un événement WebSocket pour mettre à jour le store en temps réel
    getSocket()?.emitToStore('storestatus:updated', { isActive: status.isActive, maintenanceMessage: status.maintenanceMessage });

    res.status(200).json({ isActive: status.isActive, maintenanceMessage: status.maintenanceMessage });
});
