const asyncHandler = require("express-async-handler");
const { Order, createOrderVerify, updateOrderVerify } = require("../Models/orderModel");
const { getSocket } = require("../socket");

// Statuts autorisés et leur ordre logique
const STATUS_FLOW = ['nouveau', 'confirmer', 'terminer'];

// @desc    Récupérer toutes les commandes
// @route   GET /store/api/order
// @access  Admin + Store
module.exports.getAllOrdersCtrl = asyncHandler(async (req, res) => {
    const orders = await Order.find()
        .populate("agencyId", "name location phone deliveryFee tourFee")
        .sort({ createdAt: -1 })
        .lean();
    res.status(200).json(orders);
});

// @desc    Créer une commande (public — depuis le store client)
// @route   POST /store/api/order
// @access  Public
module.exports.createOrderCtrl = asyncHandler(async (req, res) => {
    const { error } = createOrderVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const created = await Order.create(req.body);
    getSocket()?.emitToStore('orders:created', created);
    res.status(201).json(created);
});

// @desc    Mettre à jour une commande (statut / infos client)
// @route   PUT /store/api/order/:id
// @access  Admin + Store
module.exports.updateOrderCtrl = asyncHandler(async (req, res) => {
    // "" => null : permet de détacher l'agence depuis le dashboard
    if (req.body.agencyId === '') req.body.agencyId = null;

    const { error } = updateOrderVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .populate("agencyId", "name location phone deliveryFee tourFee")
        .lean();
    if (!updated) {
        return res.status(404).json({ message: "Commande non trouvée" });
    }
    getSocket()?.emitToStore('orders:updated', updated);
    res.status(200).json(updated);
});

// @desc    Supprimer une commande
// @route   DELETE /store/api/order/:id
// @access  Admin + Store
module.exports.deleteOrderCtrl = asyncHandler(async (req, res) => {
    const deleted = await Order.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
        return res.status(404).json({ message: "Commande non trouvée" });
    }
    getSocket()?.emitToStore('orders:deleted', deleted);
    res.status(200).json({ message: "Commande supprimée" });
});
