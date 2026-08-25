const asyncHandler = require("express-async-handler");
const { Client, createClientVerify } = require("../Models/clientModel");
const { getSocket } = require("../socket");

// @desc    Rechercher des clients par nom, email ou numéro de téléphone
// @route   GET /store/api/client?search=...
// @access  Admin + Store
module.exports.searchClientsCtrl = asyncHandler(async (req, res) => {
    const search = (req.query.search || '').toString().trim();
    const filter = {};
    if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        filter.$or = [
            { name: regex },
            { email: regex },
            { phone: regex }
        ];
    }
    const clients = await Client.find(filter)
        .sort({ name: 1 })
        .limit(50)
        .lean();
    res.status(200).json(clients);
});

// @desc    Créer un client
// @route   POST /store/api/client
// @access  Admin + Store
module.exports.createClientCtrl = asyncHandler(async (req, res) => {
    const { error } = createClientVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const client = await Client.create({
        name: req.body.name.trim(),
        email: req.body.email ? req.body.email.trim().toLowerCase() : '',
        phone: req.body.phone ? req.body.phone.trim() : '',
        address: req.body.address ? req.body.address.trim() : ''
    });
    getSocket()?.emitToStore('clients:created', client);
    res.status(201).json(client);
});
