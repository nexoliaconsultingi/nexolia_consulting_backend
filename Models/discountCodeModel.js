const mongoose = require('mongoose');
const Joi = require('joi');

const discountCodeSchema = new mongoose.Schema({
    // Le code que le client saisit (ex: NEXOLIA10)
    code: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        uppercase: true,
        minlength: 3,
        maxlength: 30
    },
    // Pourcentage de remise appliqué
    percentage: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    // Produits du store liés à ce code (vide = s'applique à tous les produits)
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    // Description / titre optionnel
    title: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    },
    active: {
        type: Boolean,
        default: true
    },
    // Nombre d'utilisations
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Limite d'utilisations (0 = illimité)
    maxUsage: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Validation de création
function createDiscountCodeVerify(obj) {
    const schema = Joi.object({
        code: Joi.string().trim().uppercase().min(3).max(30).required(),
        percentage: Joi.number().min(1).max(100).required(),
        products: Joi.array().items(Joi.string()).default([]),
        title: Joi.string().trim().allow('').max(200).default(''),
        active: Joi.boolean().default(true),
        maxUsage: Joi.number().min(0).default(0)
    });
    return schema.validate(obj);
}

// Validation de mise à jour
function updateDiscountCodeVerify(obj) {
    const schema = Joi.object({
        code: Joi.string().trim().uppercase().min(3).max(30),
        percentage: Joi.number().min(1).max(100),
        products: Joi.array().items(Joi.string()),
        title: Joi.string().trim().allow('').max(200),
        active: Joi.boolean(),
        maxUsage: Joi.number().min(0)
    });
    return schema.validate(obj);
}

module.exports = { DiscountCode: mongoose.model('DiscountCode', discountCodeSchema), createDiscountCodeVerify, updateDiscountCodeVerify };
