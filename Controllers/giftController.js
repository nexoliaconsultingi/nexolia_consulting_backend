const asyncHandler = require("express-async-handler");
const { Gift, createGiftVerify, updateGiftVerify, sanitizeStringArray, imagesVerify, computePreLiberationDisplayDate } = require("../Models/giftModel");
const { Client } = require("../Models/clientModel");
const { getSocket } = require("../socket");

// @desc    Récupérer tous les cadeaux
// @route   GET /store/api/gift
// @access  Admin + Store
module.exports.getAllGiftsCtrl = asyncHandler(async (req, res) => {
    // Filtre optionnel ?published=true : ne renvoie que les cadeaux partagés sur le site web
    // Filtre optionnel ?winner=true : ne renvoie que les cadeaux dont le gagnant est déclaré
    const filter = {};
    if (req.query.published === 'true') {
        filter.published = true;
    }
    if (req.query.winner === 'true') {
        filter.winner = { $ne: null };
    }
    const gifts = await Gift.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json(gifts);
});

// @desc    Récupérer un cadeau par son id
// @route   GET /store/api/gift/:id
// @access  Admin + Store
module.exports.getGiftCtrl = asyncHandler(async (req, res) => {
    const gift = await Gift.findById(req.params.id).lean();
    if (!gift) {
        return res.status(404).json({ message: "Gift not found" });
    }
    res.status(200).json(gift);
});

// @desc    Créer un cadeau
// @route   POST /store/api/gift
// @access  Admin + Store
module.exports.createGiftCtrl = asyncHandler(async (req, res) => {
    const { error } = createGiftVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const imagesError = imagesVerify(req.body.images);
    if (imagesError) {
        return res.status(400).json({ message: imagesError });
    }
    const gift = await Gift.create({
        title: req.body.title,
        description: req.body.description || '',
        images: req.body.images,
        price: req.body.price,
        tags: sanitizeStringArray(req.body.tags),
        published: req.body.published ?? false,
        declarationDate: req.body.declarationDate || null,
        preLiberationText: req.body.preLiberationText || '',
        preLiberationDisplayDate: computePreLiberationDisplayDate(req.body.declarationDate),
        conditions: sanitizeStringArray(req.body.conditions)
    });
    // Temps réel : admin + store voient le nouveau cadeau sans recharger
    getSocket()?.emitToStore('gifts:created', gift);
    res.status(201).json(gift);
});

// @desc    Modifier un cadeau
// @route   PUT /store/api/gift/:id
// @access  Admin + Store
module.exports.updateGiftCtrl = asyncHandler(async (req, res) => {
    const { error } = updateGiftVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.images !== undefined) {
        const imagesError = imagesVerify(req.body.images);
        if (imagesError) {
            return res.status(400).json({ message: imagesError });
        }
        updateData.images = req.body.images;
    }
    if (req.body.price !== undefined) updateData.price = req.body.price;
    if (req.body.published !== undefined) updateData.published = req.body.published;
    if (req.body.declarationDate !== undefined) {
        updateData.declarationDate = req.body.declarationDate || null;
        // La date d'affichage du texte avant libération est recalculée automatiquement
        updateData.preLiberationDisplayDate = computePreLiberationDisplayDate(req.body.declarationDate);
    }
    if (req.body.preLiberationText !== undefined) updateData.preLiberationText = req.body.preLiberationText;
    if (req.body.tags !== undefined) updateData.tags = sanitizeStringArray(req.body.tags);
    if (req.body.conditions !== undefined) updateData.conditions = sanitizeStringArray(req.body.conditions);

    const updated = await Gift.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updated) {
        return res.status(404).json({ message: "Gift not found" });
    }
    // Temps réel : admin + store voient la modification sans recharger
    getSocket()?.emitToStore('gifts:updated', updated);
    res.status(200).json(updated);
});

// @desc    Déclarer / modifier le gagnant d'un cadeau
// @route   PUT /store/api/gift/:id/winner
// @access  Admin + Store
module.exports.setGiftWinnerCtrl = asyncHandler(async (req, res) => {
    const { clientId } = req.body;
    if (!clientId) {
        return res.status(400).json({ message: "L'identifiant du client est obligatoire" });
    }
    const gift = await Gift.findById(req.params.id);
    if (!gift) {
        return res.status(404).json({ message: "Gift not found" });
    }
    const client = await Client.findById(clientId);
    if (!client) {
        return res.status(404).json({ message: "Client not found" });
    }
    gift.winner = {
        clientId: client._id,
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        wonAt: new Date()
    };
    await gift.save();
    // Temps réel : admin + store voient le gagnant sans recharger
    getSocket()?.emitToStore('gifts:updated', gift);
    res.status(200).json(gift);
});

// @desc    Retirer le gagnant déclaré d'un cadeau
// @route   DELETE /store/api/gift/:id/winner
// @access  Admin + Store
module.exports.clearGiftWinnerCtrl = asyncHandler(async (req, res) => {
    const gift = await Gift.findById(req.params.id);
    if (!gift) {
        return res.status(404).json({ message: "Gift not found" });
    }
    gift.winner = null;
    await gift.save();
    // Temps réel : admin + store voient la modification sans recharger
    getSocket()?.emitToStore('gifts:updated', gift);
    res.status(200).json(gift);
});

// @desc    Supprimer un cadeau
// @route   DELETE /store/api/gift/:id
// @access  Admin + Store
module.exports.deleteGiftCtrl = asyncHandler(async (req, res) => {
    const gift = await Gift.findByIdAndDelete(req.params.id);
    if (!gift) {
        return res.status(404).json({ message: "Gift not found" });
    }
    // Temps réel : admin + store voient la suppression sans recharger
    getSocket()?.emitToStore('gifts:deleted', { id: req.params.id });
    res.status(200).json({ message: "Gift deleted successfully" });
});
