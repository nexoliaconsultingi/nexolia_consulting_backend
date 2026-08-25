const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { Package, createPackageVerify, updatePackageVerify, imageVerify } = require("../Models/packageModel");
const { Product } = require("../Models/productModel");
const { getSocket } = require("../socket");

const PACKAGE_POPULATE = {
    path: 'products.productId',
    select: 'identifier name unit salePrice promoPrice onPromotion'
};

// Prix de vente effectif d'un produit : prix promo si en solde, sinon prix normal
function effectivePrice(product) {
    if (!product) return 0;
    const base = Number(product.onPromotion ? product.promoPrice : product.salePrice) || 0;
    return Math.round(base * 100) / 100;
}

// Calcule les lignes + totaux d'un package depuis les produits courants
// Retourne { rows, totalSalePrice, salePrice, savedAmount }
async function computePackage(products, discountPercentage) {
    const discount = Number(discountPercentage) || 0;
    const docs = await Product.find({ _id: { $in: products } }).select('salePrice promoPrice onPromotion');
    const map = new Map(docs.map((d) => [String(d._id), d]));
    const rows = products.map((id) => {
        const doc = map.get(String(id));
        const price = effectivePrice(doc);
        return { productId: id, salePrice: price };
    });
    const totalSalePrice = Math.round(rows.reduce((sum, r) => sum + r.salePrice, 0) * 100) / 100;
    const salePrice = Math.round(totalSalePrice * (1 - discount / 100) * 100) / 100;
    const savedAmount = Math.round((totalSalePrice - salePrice) * 100) / 100;
    return { rows, totalSalePrice, salePrice, savedAmount };
}

// Vérifie qu'une liste d'ids produit est valide (format + existence)
async function verifyProducts(products) {
    for (const id of products) {
        if (!mongoose.Types.ObjectId.isValid(id) || !(await Product.findById(id))) {
            return `Produit introuvable : ${id}`;
        }
    }
    return null;
}

// @desc    Récupérer tous les packages
// @route   GET /store/api/package
// @access  Admin + Store
module.exports.getAllPackagesCtrl = asyncHandler(async (req, res) => {
    const packages = await Package.find()
        .populate(PACKAGE_POPULATE)
        .sort({ createdAt: -1 })
        .lean();
    res.status(200).json(packages);
});

// @desc    Récupérer un package par son id
// @route   GET /store/api/package/:id
// @access  Admin + Store
module.exports.getPackageCtrl = asyncHandler(async (req, res) => {
    const pkg = await Package.findById(req.params.id).populate(PACKAGE_POPULATE).lean();
    if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
    }
    res.status(200).json(pkg);
});

// @desc    Créer un package
// @route   POST /store/api/package
// @access  Admin + Store
module.exports.createPackageCtrl = asyncHandler(async (req, res) => {
    const { error } = createPackageVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const existing = await Package.findOne({
        identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
    });
    if (existing) {
        return res.status(400).json({ message: "Cet identifiant de package existe déjà" });
    }
    const products = [...new Set(req.body.products.map((id) => String(id)))];
    const verifyError = await verifyProducts(products);
    if (verifyError) {
        return res.status(400).json({ message: verifyError });
    }
    const imgError = imageVerify(req.body.image);
    if (imgError) {
        return res.status(400).json({ message: imgError });
    }
    const { rows, totalSalePrice, salePrice, savedAmount } = await computePackage(products, req.body.discountPercentage);

    const pkg = await Package.create({
        identifier: req.body.identifier,
        title: req.body.title,
        description: req.body.description || '',
        products: rows,
        discountPercentage: req.body.discountPercentage ?? 0,
        totalSalePrice,
        salePrice,
        savedAmount,
        active: req.body.active ?? true,
        image: req.body.image
    });
    const populated = await Package.findById(pkg._id).populate(PACKAGE_POPULATE);
    // Temps réel : admin + store voient le nouveau package sans recharger
    getSocket()?.emitToStore('packages:created', populated);
    res.status(201).json(populated);
});

// @desc    Modifier un package (recalcule automatiquement les totaux si besoin)
// @route   PUT /store/api/package/:id
// @access  Admin + Store
module.exports.updatePackageCtrl = asyncHandler(async (req, res) => {
    const { error } = updatePackageVerify(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
    }
    if (req.body.identifier !== undefined) {
        const existing = await Package.findOne({
            _id: { $ne: req.params.id },
            identifier: { $regex: `^${req.body.identifier}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(400).json({ message: "Cet identifiant de package existe déjà" });
        }
    }
    const updateData = {};
    if (req.body.identifier !== undefined) updateData.identifier = req.body.identifier;
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.discountPercentage !== undefined) updateData.discountPercentage = req.body.discountPercentage;
    if (req.body.active !== undefined) updateData.active = req.body.active;
    if (req.body.image !== undefined) {
        const imgError = imageVerify(req.body.image);
        if (imgError) {
            return res.status(400).json({ message: imgError });
        }
        updateData.image = req.body.image;
    }

    const productIds = req.body.products !== undefined
        ? [...new Set(req.body.products.map((id) => String(id)))]
        : pkg.products.map((p) => String(p.productId));

    if (req.body.products !== undefined) {
        const verifyError = await verifyProducts(productIds);
        if (verifyError) {
            return res.status(400).json({ message: verifyError });
        }
    }

    if (req.body.products !== undefined || req.body.discountPercentage !== undefined) {
        const discount = req.body.discountPercentage ?? pkg.discountPercentage;
        const { rows, totalSalePrice, salePrice, savedAmount } = await computePackage(productIds, discount);
        updateData.products = rows;
        updateData.totalSalePrice = totalSalePrice;
        updateData.salePrice = salePrice;
        updateData.savedAmount = savedAmount;
    }

    const updated = await Package.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate(PACKAGE_POPULATE);
    if (!updated) {
        return res.status(404).json({ message: "Package not found" });
    }
    // Temps réel : admin + store voient la modification sans recharger
    getSocket()?.emitToStore('packages:updated', updated);
    res.status(200).json(updated);
});

// @desc    Supprimer un package
// @route   DELETE /store/api/package/:id
// @access  Admin + Store
module.exports.deletePackageCtrl = asyncHandler(async (req, res) => {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
    }
    // Temps réel : admin + store voient la suppression sans recharger
    getSocket()?.emitToStore('packages:deleted', { id: req.params.id });
    res.status(200).json({ message: "Package deleted successfully" });
});
