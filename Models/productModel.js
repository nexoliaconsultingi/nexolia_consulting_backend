const mongoose = require('mongoose');
const Joi = require('joi');

// Sous-schéma d'une caractéristique : couple caractère + détail (ex : "Résolution" / "4K UHD")
const characteristicSchema = new mongoose.Schema({
    character: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100
    },
    detail: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 500
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 1,
        maxlength: 50
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 150
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    unit: {
        type: String,
        enum: ['piece', 'pack', 'palette', 'carton', 'kg', 'litre'],
        default: 'piece'
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0
    },
    unitPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    vatRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Prix de vente au client (devise : dinar tunisien)
    salePrice: {
        type: Number,
        default: 0,
        min: 0
    },
    // Produit en solde / promotion
    onPromotion: {
        type: Boolean,
        default: false
    },
    // Pourcentage de réduction appliqué au prix de vente (ex : 10 = -10%)
    promoPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Prix de vente effectif après réduction (calculé automatiquement)
    promoPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    // Prix unitaire TTC (calculé automatiquement depuis unitPrice + vatRate)
    priceTTC: {
        type: Number,
        default: 0,
        min: 0
    },
    // Total TTC = priceTTC x quantity (calculé automatiquement)
    totalTTC: {
        type: Number,
        default: 0,
        min: 0
    },
    depotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Depot',
        required: true
    },
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fournisseur',
        required: true
    },
    // 3 images du produit, stockées en base64 (data:image/webp;base64,...)
    images: {
        type: [String],
        validate: {
            validator: (arr) => !arr || (Array.isArray(arr) && arr.length <= 3),
            message: 'Un produit peut avoir au maximum 3 images'
        },
        default: []
    },
    // Caractéristiques du produit (tableau de couples caractère + détail, rempli manuellement)
    characteristics: {
        type: [characteristicSchema],
        default: []
    },
    // Produit mis en avant comme "Les plus vendus" (affiché sur le site web de la boutique)
    bestSeller: {
        type: Boolean,
        default: false
    },
    // Produit mis en avant comme "Nouveauté" (affiché sur le site web de la boutique)
    newArrival: {
        type: Boolean,
        default: false
    },
    // Produit mis en avant comme "Tendance du moment" (affiché sur le site web de la boutique)
    trending: {
        type: Boolean,
        default: false
    },
    // Garantie du produit
    hasWarranty: {
        type: Boolean,
        default: false
    },
    warrantyMonths: {
        type: Number,
        min: 0,
        default: 0
    },
    // Couleurs disponibles pour ce produit
    colors: {
        type: [{
            name: { type: String, required: true, trim: true, maxlength: 50 },
            hex: { type: String, required: true, trim: true, maxlength: 7 }
        }],
        default: [],
        validate: {
            validator: (arr) => !arr || arr.length <= 20,
            message: 'Un produit peut avoir au maximum 20 couleurs'
        }
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

const IMAGE_PREFIXES = ['data:image/webp;base64,', 'data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/jpg;base64,', 'data:image/gif;base64,'];

// Vérifie qu'une valeur est un tableau de 3 images base64 valides
function imagesVerify(value) {
    if (!Array.isArray(value)) {
        return 'images doit être un tableau de 3 images';
    }
    if (value.length !== 3) {
        return 'Un produit doit avoir exactement 3 images';
    }
    for (const img of value) {
        if (typeof img !== 'string' || !IMAGE_PREFIXES.some((p) => img.startsWith(p)) || img.length > 3000000) {
            return 'Chaque image doit être une data URI valide (max 3 Mo)';
        }
    }
    return null;
}

// Nettoie un tableau de caractéristiques : ne garde que les lignes complètes (caractère + détail)
function sanitizeCharacteristics(value) {
    if (!Array.isArray(value)) return [];
    return value
        .map((c) => ({
            character: String(c?.character ?? '').trim(),
            detail: String(c?.detail ?? '').trim()
        }))
        .filter((c) => c.character.length > 0 && c.detail.length > 0)
        .slice(0, 50);
}

// Nettoie un tableau de couleurs : ne garde que les entrées valides (nom + hex)
function sanitizeColors(value) {
    if (!Array.isArray(value)) return [];
    return value
        .map((c) => ({
            name: String(c?.name ?? '').trim(),
            hex: String(c?.hex ?? '').trim()
        }))
        .filter((c) => c.name.length > 0 && /^#[0-9A-Fa-f]{6}$/.test(c.hex))
        .slice(0, 20);
}

// Validation de création
function createProductVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50).required(),
        name: Joi.string().trim().min(1).max(150).required(),
        description: Joi.string().trim().max(500).allow(''),
        unit: Joi.string().valid('piece', 'pack', 'palette', 'carton', 'kg', 'litre').default('piece'),
        quantity: Joi.number().min(0).default(0),
        unitPrice: Joi.number().min(0).default(0),
        vatRate: Joi.number().min(0).max(100).default(0),
        salePrice: Joi.number().min(0).default(0),
        onPromotion: Joi.boolean().default(false),
        promoPercentage: Joi.number().min(0).max(100).default(0),
        depotId: Joi.string().required(),
        zoneId: Joi.string().required(),
        categoryId: Joi.string().required(),
        supplierId: Joi.string().required(),
        images: Joi.array().items(Joi.string().max(3000000)).length(3).required(),
        characteristics: Joi.array().items(Joi.object({
            character: Joi.string().trim().max(100).allow(''),
            detail: Joi.string().trim().max(500).allow('')
        })).default([]),
        bestSeller: Joi.boolean().default(false),
        newArrival: Joi.boolean().default(false),
        trending: Joi.boolean().default(false),
        hasWarranty: Joi.boolean().default(false),
        warrantyMonths: Joi.number().integer().min(0).default(0),
        colors: Joi.array().items(Joi.object({
            name: Joi.string().trim().max(50).required(),
            hex: Joi.string().trim().max(7).required()
        })).max(20).default([])
    });
    return schema.validate(obj);
}

// Validation de mise à jour (champs optionnels)
function updateProductVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50),
        name: Joi.string().trim().min(1).max(150),
        description: Joi.string().trim().max(500).allow(''),
        unit: Joi.string().valid('piece', 'pack', 'palette', 'carton', 'kg', 'litre'),
        quantity: Joi.number().min(0),
        unitPrice: Joi.number().min(0),
        vatRate: Joi.number().min(0).max(100),
        salePrice: Joi.number().min(0),
        onPromotion: Joi.boolean(),
        promoPercentage: Joi.number().min(0).max(100),
        depotId: Joi.string(),
        zoneId: Joi.string(),
        categoryId: Joi.string(),
        supplierId: Joi.string(),
        images: Joi.array().items(Joi.string().max(3000000)).length(3),
        characteristics: Joi.array().items(Joi.object({
            character: Joi.string().trim().max(100).allow(''),
            detail: Joi.string().trim().max(500).allow('')
        })),
        bestSeller: Joi.boolean(),
        newArrival: Joi.boolean(),
        trending: Joi.boolean(),
        hasWarranty: Joi.boolean(),
        warrantyMonths: Joi.number().integer().min(0),
        colors: Joi.array().items(Joi.object({
            name: Joi.string().trim().max(50).required(),
            hex: Joi.string().trim().max(7).required()
        })).max(20)
    });
    return schema.validate(obj);
}

// Calcul automatique du prix TTC et du total TTC
function computeTTC(unitPrice, vatRate, quantity) {
    const pu = Number(unitPrice) || 0;
    const vat = Number(vatRate) || 0;
    const qty = Number(quantity) || 0;
    const priceTTC = Math.round(pu * (1 + vat / 100) * 100) / 100;
    const totalTTC = Math.round(priceTTC * qty * 100) / 100;
    return { priceTTC, totalTTC };
}

// Calcul automatique du prix de vente effectif après réduction
// Ex : salePrice 10 + promo 10% -> promoPrice 9
function computePromoPrice(salePrice, onPromotion, promoPercentage) {
    const base = Number(salePrice) || 0;
    const isPromo = Boolean(onPromotion);
    const pct = isPromo ? (Number(promoPercentage) || 0) : 0;
    if (!isPromo || pct <= 0) {
        return Math.round(base * 100) / 100;
    }
    const reduced = base * (1 - pct / 100);
    return Math.round(reduced * 100) / 100;
}

module.exports = { Product, createProductVerify, updateProductVerify, computeTTC, computePromoPrice, imagesVerify, sanitizeCharacteristics, sanitizeColors };
