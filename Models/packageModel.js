const mongoose = require('mongoose');
const Joi = require('joi');

const IMAGE_PREFIXES = ['data:image/webp;base64,', 'data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/jpg;base64,', 'data:image/gif;base64,'];

// Produit sélectionné dans un package avec le prix de vente instantané au moment de l'enregistrement
const packageProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // Prix de vente effectif du produit (prix normal ou prix promo si en solde) au moment de l'enregistrement
    salePrice: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const packageSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 1,
        maxlength: 50
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },
    // Produits sélectionnés pour composer le package
    products: [packageProductSchema],
    // Pourcentage de remise appliqué sur le total des prix de vente des produits
    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Total des prix de vente des produits (calculé automatiquement)
    totalSalePrice: {
        type: Number,
        default: 0,
        min: 0
    },
    // Prix de vente du package = total x (1 - remise/100) (calculé automatiquement)
    salePrice: {
        type: Number,
        default: 0,
        min: 0
    },
    // Montant économisé = total - prix du package (calculé automatiquement)
    savedAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Package visible / disponible à la vente
    active: {
        type: Boolean,
        default: true
    },
    // Image du package, stockée en base64 (data:image/...;base64,...) — 1 image obligatoire
    image: {
        type: String,
        required: true,
        validate: {
            validator: (v) => typeof v === 'string' && IMAGE_PREFIXES.some((p) => v.startsWith(p)) && v.length <= 3000000,
            message: 'Image du package invalide (data URI valide, max 3 Mo)'
        }
    }
}, {
    timestamps: true
});

const Package = mongoose.model('Package', packageSchema);

// Vérifie qu'une valeur est une image data URI valide (max 3 Mo)
function imageVerify(value) {
    if (typeof value !== 'string' || !IMAGE_PREFIXES.some((p) => value.startsWith(p)) || value.length > 3000000) {
        return "L'image du package doit être une data URI valide (max 3 Mo)";
    }
    return null;
}

// Validation de création
function createPackageVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50).required(),
        title: Joi.string().trim().min(1).max(200).required(),
        description: Joi.string().trim().max(1000).allow('').default(''),
        products: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
        discountPercentage: Joi.number().min(0).max(100).default(0),
        active: Joi.boolean().default(true),
        image: Joi.string().trim().min(1).max(3000000).required()
    });
    return schema.validate(obj);
}

// Validation de mise à jour (champs optionnels)
function updatePackageVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50),
        title: Joi.string().trim().min(1).max(200),
        description: Joi.string().trim().max(1000).allow(''),
        products: Joi.array().items(Joi.string().trim().min(1)).min(1),
        discountPercentage: Joi.number().min(0).max(100),
        active: Joi.boolean(),
        image: Joi.string().trim().min(1).max(3000000)
    });
    return schema.validate(obj);
}

module.exports = { Package, createPackageVerify, updatePackageVerify, imageVerify };
