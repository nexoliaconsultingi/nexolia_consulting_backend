const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { FlashOffer, createFlashOfferVerify, updateFlashOfferVerify } = require("../Models/flashOfferModel");
const { Product, computePromoPrice } = require("../Models/productModel");
const { getSocket } = require("../socket");

const OFFER_POPULATE = {
    path: 'products.productId',
    select: 'identifier name description unit salePrice promoPrice onPromotion promoPercentage images categoryId depotId zoneId supplierId'
};

// @desc    Applique la promotion d'une offre à ses produits (au démarrage)
// @route   -
// @access  interne
async function applyOfferProducts(offer) {
    for (const item of offer.products) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        item.originalSalePrice = product.salePrice;
        item.promoPrice = computePromoPrice(product.salePrice, true, item.promoPercentage);
        product.onPromotion = true;
        product.promoPercentage = item.promoPercentage;
        product.promoPrice = item.promoPrice;
        await product.save();
    }
    await offer.save();
}

// @desc    Remet les produits au prix normal et désactive la promotion (fin d'offre)
// @route   -
// @access  interne
async function revertOfferProducts(offer) {
    for (const item of offer.products) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        product.onPromotion = false;
        product.promoPercentage = 0;
        product.promoPrice = product.salePrice;
        await product.save();
    }
}

// @desc    Termine les offres dont la durée est écoulée (revert automatique)
// @route   -
// @access  interne
async function completeExpiredOffers() {
    const now = new Date();
    const expired = await FlashOffer.find({ status: 'active', endsAt: { $lte: now } });
    for (const offer of expired) {
        await revertOfferProducts(offer);
        offer.status = 'completed';
        await offer.save();
        getSocket()?.emitToStore('flashoffers:updated', offer);
    }
    if (expired.length > 0) {
        getSocket()?.emitToStore('products:updated');
    }
}

// @desc    Watchdog : vérifie périodiquement les offres expirées
// @route   -
// @access  interne
function startFlashOfferWatchdog() {
    setInterval(() => {
        completeExpiredOffers().catch(() => {});
    }, 15000);
}

// @desc    Récupérer toutes les offres flash
// @route   GET /store/api/flashoffer
// @access  Admin + Store
module.exports.getAllFlashOffersCtrl = asyncHandler(async (req, res) => {
    await completeExpiredOffers();
    const offers = await FlashOffer.find()
        .populate(OFFER_POPULATE)
        .sort({ createdAt: -1 })
        .lean();
    res.status(200).json(offers);
});

// @desc    Récupérer une offre flash par son id
// @route   GET /store/api/flashoffer/:id
// @access  Admin + Store
module.exports.getFlashOfferCtrl = asyncHandler(async (req, res) => {
    await completeExpiredOffers();
    const offer = await FlashOffer.findById(req.params.id).populate(OFFER_POPULATE).lean();
    if (!offer) {
        return res.status(404).json({ message: "Flash offer not found" });
    }
    res.status(200).json(offer);
});

// @desc    Créer une offre flash
// @route   POST /store/api/flashoffer
// @access  Admin + Store
module.exports.createFlashOfferCtrl = asyncHandler(async (req, res) => {
    const { error } = createFlashOfferVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const existing = await FlashOffer.findOne({
        identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
    });
    if (existing) {
        return res.status(400).json({ message: "Cet identifiant d'offre flash existe déjà" });
    }
    for (const item of req.body.products) {
        if (!mongoose.Types.ObjectId.isValid(item.productId) || !(await Product.findById(item.productId))) {
            return res.status(400).json({ message: `Produit introuvable : ${item.productId}` });
        }
    }
    const products = req.body.products.map((p) => ({
        productId: p.productId,
        promoPercentage: p.promoPercentage,
        originalSalePrice: 0,
        promoPrice: 0
    }));

    let offer = await FlashOffer.create({
        identifier: req.body.identifier,
        title: req.body.title,
        products,
        durationHours: req.body.durationHours,
        status: 'pending'
    });

    // Si l'offre doit commencer immédiatement, on la démarre tout de suite
    if (req.body.status === 'active') {
        offer.startedAt = new Date();
        offer.endsAt = new Date(Date.now() + offer.durationHours * 3600 * 1000);
        offer.status = 'active';
        await applyOfferProducts(offer);
        getSocket()?.emitToStore('products:updated');
    }

    const populated = await FlashOffer.findById(offer._id).populate(OFFER_POPULATE);
    getSocket()?.emitToStore('flashoffers:created', populated);
    res.status(201).json(populated);
});

// @desc    Démarrer une offre flash (démarre le compte à rebours)
// @route   POST /store/api/flashoffer/:id/start
// @access  Admin + Store
module.exports.startFlashOfferCtrl = asyncHandler(async (req, res) => {
    const offer = await FlashOffer.findById(req.params.id);
    if (!offer) {
        return res.status(404).json({ message: "Flash offer not found" });
    }
    if (offer.status !== 'pending') {
        return res.status(400).json({ message: "Cette offre flash a déjà été démarrée ou est terminée" });
    }
    offer.startedAt = new Date();
    offer.endsAt = new Date(Date.now() + offer.durationHours * 3600 * 1000);
    offer.status = 'active';
    await applyOfferProducts(offer);

    const populated = await FlashOffer.findById(offer._id).populate(OFFER_POPULATE);
    getSocket()?.emitToStore('flashoffers:updated', populated);
    getSocket()?.emitToStore('products:updated');
    res.status(200).json(populated);
});

// @desc    Modifier une offre flash (uniquement tant qu'elle n'est pas démarrée)
// @route   PUT /store/api/flashoffer/:id
// @access  Admin + Store
module.exports.updateFlashOfferCtrl = asyncHandler(async (req, res) => {
    const offer = await FlashOffer.findById(req.params.id);
    if (!offer) {
        return res.status(404).json({ message: "Flash offer not found" });
    }
    if (offer.status !== 'pending') {
        return res.status(400).json({ message: "Impossible de modifier une offre démarrée ou terminée" });
    }
    const { error } = updateFlashOfferVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    if (req.body.identifier !== undefined) {
        const existing = await FlashOffer.findOne({
            _id: { $ne: req.params.id },
            identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(400).json({ message: "Cet identifiant d'offre flash existe déjà" });
        }
    }
    if (req.body.products !== undefined) {
        for (const item of req.body.products) {
            if (!mongoose.Types.ObjectId.isValid(item.productId) || !(await Product.findById(item.productId))) {
                return res.status(400).json({ message: `Produit introuvable : ${item.productId}` });
            }
        }
    }
    const updateData = {};
    if (req.body.identifier !== undefined) updateData.identifier = req.body.identifier;
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.durationHours !== undefined) updateData.durationHours = req.body.durationHours;
    if (req.body.products !== undefined) {
        updateData.products = req.body.products.map((p) => ({
            productId: p.productId,
            promoPercentage: p.promoPercentage,
            originalSalePrice: 0,
            promoPrice: 0
        }));
    }
    const updated = await FlashOffer.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate(OFFER_POPULATE);
    getSocket()?.emitToStore('flashoffers:updated', updated);
    res.status(200).json(updated);
});

// @desc    Supprimer une offre flash (les produits reviennent au prix normal)
// @route   DELETE /store/api/flashoffer/:id
// @access  Admin + Store
module.exports.deleteFlashOfferCtrl = asyncHandler(async (req, res) => {
    const offer = await FlashOffer.findById(req.params.id);
    if (!offer) {
        return res.status(404).json({ message: "Flash offer not found" });
    }
    await revertOfferProducts(offer);
    await FlashOffer.findByIdAndDelete(req.params.id);
    getSocket()?.emitToStore('flashoffers:deleted', { id: req.params.id });
    getSocket()?.emitToStore('products:updated');
    res.status(200).json({ message: "Flash offer deleted successfully" });
});

module.exports.startFlashOfferWatchdog = startFlashOfferWatchdog;
