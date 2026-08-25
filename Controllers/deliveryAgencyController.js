const asyncHandler = require("express-async-handler");
const { DeliveryAgency, createDeliveryAgencyVerify, updateDeliveryAgencyVerify } = require("../Models/deliveryAgencyModel");
const { getSocket } = require("../socket");

// @desc    Récupérer toutes les agences de livraison
// @route   GET /store/api/deliveryagency
// @access  Admin + Store
module.exports.getAllDeliveryAgenciesCtrl = asyncHandler(async (req, res) => {
    const agencies = await DeliveryAgency.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(agencies);
});

// @desc    Créer une agence de livraison
// @route   POST /store/api/deliveryagency
// @access  Admin + Store
module.exports.createDeliveryAgencyCtrl = asyncHandler(async (req, res) => {
    const { error } = createDeliveryAgencyVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const created = await DeliveryAgency.create(req.body);
    getSocket()?.emitToStore('deliveryagencies:created', created);
    res.status(201).json(created);
});

// @desc    Mettre à jour une agence de livraison
// @route   PUT /store/api/deliveryagency/:id
// @access  Admin + Store
module.exports.updateDeliveryAgencyCtrl = asyncHandler(async (req, res) => {
    const { error } = updateDeliveryAgencyVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const updated = await DeliveryAgency.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!updated) {
        return res.status(404).json({ message: "Agence de livraison non trouvée" });
    }
    getSocket()?.emitToStore('deliveryagencies:updated', updated);
    res.status(200).json(updated);
});

// @desc    Supprimer une agence de livraison
// @route   DELETE /store/api/deliveryagency/:id
// @access  Admin + Store
module.exports.deleteDeliveryAgencyCtrl = asyncHandler(async (req, res) => {
    const deleted = await DeliveryAgency.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
        return res.status(404).json({ message: "Agence de livraison non trouvée" });
    }
    // Détacher l'agence des commandes qui y étaient liées
    const { Order } = require("../Models/orderModel");
    await Order.updateMany({ agencyId: deleted._id }, { $set: { agencyId: null } });
    getSocket()?.emitToStore('deliveryagencies:deleted', deleted);
    res.status(200).json({ message: "Agence supprimée" });
});
