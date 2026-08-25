const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { Product, createProductVerify, updateProductVerify, computeTTC, computePromoPrice, imagesVerify, sanitizeCharacteristics, sanitizeColors } = require("../Models/productModel");
const { Depot } = require("../Models/depotModel");
const { Zone } = require("../Models/zoneModel");
const { Category } = require("../Models/categoryModel");
const { Fournisseur } = require("../Models/fournisseurModel");
const { getSocket } = require("../socket");

// @desc    Récupérer tous les produits
// @route   GET /store/api/product
// @access  Admin + Store
module.exports.getAllProductsCtrl = asyncHandler(async (req, res) => {
    // Filtre optionnel ?bestSeller=true : ne renvoie que les produits "Les plus vendus"
    // Filtre optionnel ?newArrival=true : ne renvoie que les produits "Nouveautés"
    // Filtre optionnel ?trending=true : ne renvoie que les produits "Tendances du moment"
    const filter = {};
    if (req.query.bestSeller === 'true') {
        filter.bestSeller = true;
    }
    if (req.query.newArrival === 'true') {
        filter.newArrival = true;
    }
    if (req.query.trending === 'true') {
        filter.trending = true;
    }
    const products = await Product.find(filter)
        .populate("depotId", "identifier name")
        .populate("zoneId", "identifier name")
        .populate("categoryId", "identifier name")
        .populate("supplierId", "name")
        .sort({ createdAt: -1 })
        .lean();
    res.status(200).json(products);
});

// @desc    Récupérer un produit par son id
// @route   GET /store/api/product/:id
// @access  Admin + Store
module.exports.getProductCtrl = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate("depotId", "identifier name")
        .populate("zoneId", "identifier name")
        .populate("categoryId", "identifier name")
        .populate("supplierId", "name")
        .lean();
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
});

// @desc    Vérifier que le dépôt existe et que la zone appartient à ce dépôt
// @route   -
// @access  interne
async function verifyDepotAndZone(depotId, zoneId) {
    if (!mongoose.Types.ObjectId.isValid(depotId) || !mongoose.Types.ObjectId.isValid(zoneId)) {
        return { error: "Dépôt ou zone invalide" };
    }
    const depot = await Depot.findById(depotId);
    if (!depot) {
        return { error: "Dépôt introuvable" };
    }
    const zone = await Zone.findById(zoneId);
    if (!zone) {
        return { error: "Zone introuvable" };
    }
    if (String(zone.depotId) !== String(depotId)) {
        return { error: "La zone choisie n'appartient pas au dépôt sélectionné" };
    }
    return { depot, zone };
}

// @desc    Vérifier qu'une catégorie existe
// @route   -
// @access  interne
async function verifyCategory(categoryId) {
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        return { error: "Catégorie invalide" };
    }
    const category = await Category.findById(categoryId);
    if (!category) {
        return { error: "Catégorie introuvable" };
    }
    return { category };
}

// @desc    Vérifier qu'un fournisseur existe
// @route   -
// @access  interne
async function verifyFournisseur(supplierId) {
    if (!supplierId || !mongoose.Types.ObjectId.isValid(supplierId)) {
        return { error: "Fournisseur invalide" };
    }
    const supplier = await Fournisseur.findById(supplierId);
    if (!supplier) {
        return { error: "Fournisseur introuvable" };
    }
    return { supplier };
}

// @desc    Créer un produit
// @route   POST /store/api/product
// @access  Admin + Store
module.exports.createProductCtrl = asyncHandler(async (req, res) => {
    const { error } = createProductVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const { error: verifyError } = await verifyDepotAndZone(req.body.depotId, req.body.zoneId);
    if (verifyError) {
        return res.status(400).json({ message: verifyError });
    }
    const { error: categoryError } = await verifyCategory(req.body.categoryId);
    if (categoryError) {
        return res.status(400).json({ message: categoryError });
    }
    const { error: supplierError } = await verifyFournisseur(req.body.supplierId);
    if (supplierError) {
        return res.status(400).json({ message: supplierError });
    }
    const existing = await Product.findOne({
        identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
    });
    if (existing) {
        return res.status(400).json({ message: "Cet identifiant de produit existe déjà" });
    }
    const imagesError = imagesVerify(req.body.images);
    if (imagesError) {
        return res.status(400).json({ message: imagesError });
    }
    const characteristics = sanitizeCharacteristics(req.body.characteristics);
    const colors = sanitizeColors(req.body.colors);
    const quantity = req.body.quantity ?? 0;
    const unitPrice = req.body.unitPrice ?? 0;
    const vatRate = req.body.vatRate ?? 0;
    const { priceTTC, totalTTC } = computeTTC(unitPrice, vatRate, quantity);
    const salePrice = req.body.salePrice ?? 0;
    const onPromotion = req.body.onPromotion ?? false;
    const promoPercentage = req.body.promoPercentage ?? 0;
    const promoPrice = computePromoPrice(salePrice, onPromotion, promoPercentage);

    const product = await Product.create({
        identifier: req.body.identifier,
        name: req.body.name,
        description: req.body.description || '',
        unit: req.body.unit ?? 'piece',
        quantity,
        unitPrice,
        vatRate,
        salePrice,
        onPromotion,
        promoPercentage,
        promoPrice,
        priceTTC,
        totalTTC,
        depotId: req.body.depotId,
        zoneId: req.body.zoneId,
        categoryId: req.body.categoryId,
        supplierId: req.body.supplierId,
        images: req.body.images,
        characteristics,
        bestSeller: req.body.bestSeller ?? false,
        newArrival: req.body.newArrival ?? false,
        trending: req.body.trending ?? false,
        hasWarranty: req.body.hasWarranty ?? false,
        warrantyMonths: req.body.warrantyMonths ?? 0,
        colors
    });
    // Temps réel : admin + store voient le nouveau produit sans recharger
    getSocket()?.emitToStore('products:created', product);
    res.status(201).json(product);
});

// @desc    Modifier un produit
// @route   PUT /store/api/product/:id
// @access  Admin + Store
module.exports.updateProductCtrl = asyncHandler(async (req, res) => {
    const { error } = updateProductVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    if (req.body.identifier !== undefined) {
        const existing = await Product.findOne({
            _id: { $ne: req.params.id },
            identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(400).json({ message: "Cet identifiant de produit existe déjà" });
        }
    }

    const updateData = {};
    if (req.body.identifier !== undefined) updateData.identifier = req.body.identifier;
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.unit !== undefined) updateData.unit = req.body.unit;
    if (req.body.quantity !== undefined) updateData.quantity = req.body.quantity;
    if (req.body.unitPrice !== undefined) updateData.unitPrice = req.body.unitPrice;
    if (req.body.vatRate !== undefined) updateData.vatRate = req.body.vatRate;
    if (req.body.salePrice !== undefined) updateData.salePrice = req.body.salePrice;
    if (req.body.onPromotion !== undefined) updateData.onPromotion = req.body.onPromotion;
    if (req.body.promoPercentage !== undefined) updateData.promoPercentage = req.body.promoPercentage;
    if (req.body.images !== undefined) {
        const imagesError = imagesVerify(req.body.images);
        if (imagesError) {
            return res.status(400).json({ message: imagesError });
        }
        updateData.images = req.body.images;
    }
    if (req.body.characteristics !== undefined) {
        updateData.characteristics = sanitizeCharacteristics(req.body.characteristics);
    }
    if (req.body.bestSeller !== undefined) updateData.bestSeller = req.body.bestSeller;
    if (req.body.newArrival !== undefined) updateData.newArrival = req.body.newArrival;
    if (req.body.trending !== undefined) updateData.trending = req.body.trending;
    if (req.body.hasWarranty !== undefined) updateData.hasWarranty = req.body.hasWarranty;
    if (req.body.warrantyMonths !== undefined) updateData.warrantyMonths = req.body.warrantyMonths;
    if (req.body.colors !== undefined) updateData.colors = sanitizeColors(req.body.colors);

    const newDepotId = req.body.depotId ?? product.depotId;
    const newZoneId = req.body.zoneId ?? product.zoneId;
    if (req.body.depotId !== undefined || req.body.zoneId !== undefined) {
        const { error: verifyError } = await verifyDepotAndZone(newDepotId, newZoneId);
        if (verifyError) {
            return res.status(400).json({ message: verifyError });
        }
    }
    if (req.body.depotId !== undefined) updateData.depotId = req.body.depotId;
    if (req.body.zoneId !== undefined) updateData.zoneId = req.body.zoneId;
    if (req.body.categoryId !== undefined) {
        const { error: categoryError } = await verifyCategory(req.body.categoryId);
        if (categoryError) {
            return res.status(400).json({ message: categoryError });
        }
        updateData.categoryId = req.body.categoryId;
    }
    if (req.body.supplierId !== undefined) {
        const { error: supplierError } = await verifyFournisseur(req.body.supplierId);
        if (supplierError) {
            return res.status(400).json({ message: supplierError });
        }
        updateData.supplierId = req.body.supplierId;
    }

    // Recalcul automatique du TTC sur les valeurs finales
    const finalQuantity = updateData.quantity ?? product.quantity;
    const finalUnitPrice = updateData.unitPrice ?? product.unitPrice;
    const finalVatRate = updateData.vatRate ?? product.vatRate;
    const { priceTTC, totalTTC } = computeTTC(finalUnitPrice, finalVatRate, finalQuantity);
    updateData.priceTTC = priceTTC;
    updateData.totalTTC = totalTTC;

    // Recalcul automatique du prix de vente effectif (promotion)
    const finalSalePrice = updateData.salePrice ?? product.salePrice;
    const finalOnPromotion = updateData.onPromotion ?? product.onPromotion;
    const finalPromoPercentage = updateData.promoPercentage ?? product.promoPercentage;
    updateData.promoPrice = computePromoPrice(finalSalePrice, finalOnPromotion, finalPromoPercentage);

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate("depotId", "identifier name")
        .populate("zoneId", "identifier name")
        .populate("categoryId", "identifier name")
        .populate("supplierId", "name");
    if (!updated) {
        return res.status(404).json({ message: "Product not found" });
    }
    // Temps réel : admin + store voient la modification sans recharger
    getSocket()?.emitToStore('products:updated', updated);
    res.status(200).json(updated);
});

// @desc    Supprimer un produit
// @route   DELETE /store/api/product/:id
// @access  Admin + Store
module.exports.deleteProductCtrl = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    // Temps réel : admin + store voient la suppression sans recharger
    getSocket()?.emitToStore('products:deleted', { id: req.params.id });
    res.status(200).json({ message: "Product deleted successfully" });
});
