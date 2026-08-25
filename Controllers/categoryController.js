const asyncHandler = require("express-async-handler");
const { Category, createCategoryVerify, updateCategoryVerify, imageVerify } = require("../Models/categoryModel");
const { Product } = require("../Models/productModel");
const { getSocket } = require("../socket");

// @desc    Récupérer toutes les catégories
// @route   GET /store/api/category
// @access  Admin + Store
module.exports.getAllCategoriesCtrl = asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(categories);
});

// @desc    Récupérer une catégorie par son id
// @route   GET /store/api/category/:id
// @access  Admin + Store
module.exports.getCategoryCtrl = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id).lean();
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
});

// @desc    Créer une catégorie de produit
// @route   POST /store/api/category
// @access  Admin + Store
module.exports.createCategoryCtrl = asyncHandler(async (req, res) => {
    const { error } = createCategoryVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const existing = await Category.findOne({
        identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
    });
    if (existing) {
        return res.status(400).json({ message: "Cet identifiant de catégorie existe déjà" });
    }
    const category = await Category.create({
        identifier: req.body.identifier,
        name: req.body.name,
        icon: req.body.icon || 'Tags',
        image: req.body.image || ''
    });
    // Temps réel : admin + store voient la nouvelle catégorie sans recharger
    getSocket()?.emitToStore('categories:created', category);
    res.status(201).json(category);
});

// @desc    Modifier une catégorie
// @route   PUT /store/api/category/:id
// @access  Admin + Store
module.exports.updateCategoryCtrl = asyncHandler(async (req, res) => {
    const { error } = updateCategoryVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    if (req.body.identifier !== undefined) {
        const existing = await Category.findOne({
            _id: { $ne: req.params.id },
            identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(400).json({ message: "Cet identifiant de catégorie existe déjà" });
        }
    }
    const updateData = {};
    if (req.body.identifier !== undefined) updateData.identifier = req.body.identifier;
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.icon !== undefined) updateData.icon = req.body.icon;
    if (req.body.image !== undefined) {
        const imgError = imageVerify(req.body.image);
        if (imgError) {
            return res.status(400).json({ message: imgError });
        }
        updateData.image = req.body.image;
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updated) {
        return res.status(404).json({ message: "Category not found" });
    }
    // Temps réel : admin + store voient la modification sans recharger
    getSocket()?.emitToStore('categories:updated', updated);
    res.status(200).json(updated);
});

// @desc    Supprimer une catégorie
// @route   DELETE /store/api/category/:id
// @access  Admin + Store
module.exports.deleteCategoryCtrl = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    // Détacher les produits de la catégorie supprimée
    await Product.updateMany({ categoryId: req.params.id }, { $unset: { categoryId: 1 } });
    // Temps réel : admin + store voient la suppression sans recharger
    getSocket()?.emitToStore('categories:deleted', { id: req.params.id });
    res.status(200).json({ message: "Category deleted successfully" });
});
