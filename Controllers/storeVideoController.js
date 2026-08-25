const asyncHandler = require("express-async-handler");
const { StoreVideo, createStoreVideoVerify, updateStoreVideoVerify } = require("../Models/storeVideoModel");
const { getSocket } = require("../socket");

// ---------------------------------------------------------------------------
// Vidéos publicitaires de la store
// ---------------------------------------------------------------------------

const PRODUCT_FIELDS = '_id name unitPrice salePrice images onPromotion promoPrice';

// @desc    Liste des vidéos visibles sur le site public
// @route   GET /store/api/video
// @access  Public
module.exports.getStoreVideosPublicCtrl = asyncHandler(async (req, res) => {
    const videos = await StoreVideo.find({ active: true })
        .sort({ createdAt: -1 })
        .populate({ path: 'products', select: PRODUCT_FIELDS })
        .lean();
    videos.forEach((v) => { if (!v.products) v.products = []; });
    res.status(200).json(videos);
});

// @desc    Liste de toutes les vidéos (y compris inactives) pour l'admin
// @route   GET /store/api/video/admin
// @access  Admin + Store
module.exports.getAllStoreVideosCtrl = asyncHandler(async (req, res) => {
    const videos = await StoreVideo.find()
        .sort({ createdAt: -1 })
        .populate({ path: 'products', select: PRODUCT_FIELDS })
        .lean();
    videos.forEach((v) => { if (!v.products) v.products = []; });
    res.status(200).json(videos);
});

// @desc    Créer une vidéo publicitaire
// @route   POST /store/api/video
// @access  Admin + Store
module.exports.createStoreVideoCtrl = asyncHandler(async (req, res) => {
    const { error } = createStoreVideoVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const video = await StoreVideo.create({
        title: req.body.title.trim(),
        description: req.body.description ? req.body.description.trim() : '',
        videoUrl: req.body.videoUrl.trim(),
        active: req.body.active ?? true,
        products: req.body.products ?? []
    });
    const populated = await video.populate({ path: 'products', select: PRODUCT_FIELDS });
    getSocket()?.emitToStore('storevideo:created', populated);
    res.status(201).json(populated);
});

// @desc    Modifier une vidéo publicitaire
// @route   PUT /store/api/video/:id
// @access  Admin + Store
module.exports.updateStoreVideoCtrl = asyncHandler(async (req, res) => {
    const { error } = updateStoreVideoVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title.trim();
    if (req.body.description !== undefined) updateData.description = req.body.description.trim();
    if (req.body.videoUrl !== undefined) updateData.videoUrl = req.body.videoUrl.trim();
    if (req.body.active !== undefined) updateData.active = req.body.active;
    if (req.body.products !== undefined) updateData.products = req.body.products;

    const video = await StoreVideo.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate({ path: 'products', select: PRODUCT_FIELDS });
    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }
    getSocket()?.emitToStore('storevideo:updated', video);
    res.status(200).json(video);
});

// @desc    Supprimer une vidéo publicitaire
// @route   DELETE /store/api/video/:id
// @access  Admin + Store
module.exports.deleteStoreVideoCtrl = asyncHandler(async (req, res) => {
    const video = await StoreVideo.findByIdAndDelete(req.params.id);
    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }
    getSocket()?.emitToStore('storevideo:deleted', { id: req.params.id });
    res.status(200).json({ message: "Video deleted successfully" });
});
