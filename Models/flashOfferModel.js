const mongoose = require('mongoose');
const Joi = require('joi');

const flashOfferProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // Pourcentage de réduction appliqué à ce produit pendant l'offre
    promoPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    // Prix de vente avant l'offre (instantané au démarrage)
    originalSalePrice: {
        type: Number,
        default: 0,
        min: 0
    },
    // Prix de vente pendant l'offre (instantané au démarrage)
    promoPrice: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const flashOfferSchema = new mongoose.Schema({
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
    // Produits sélectionnés avec leur pourcentage de réduction par article
    products: [flashOfferProductSchema],
    // Durée de l'offre en heures
    durationHours: {
        type: Number,
        required: true,
        min: 0.1,
        max: 720
    },
    // pending (à venir) | active (en cours) | completed (terminée)
    status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending'
    },
    startedAt: {
        type: Date,
        default: null
    },
    endsAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const FlashOffer = mongoose.model('FlashOffer', flashOfferSchema);

// Validation de création
function createFlashOfferVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50).required(),
        title: Joi.string().trim().min(1).max(200).required(),
        products: Joi.array().items(Joi.object({
            productId: Joi.string().required(),
            promoPercentage: Joi.number().min(0).max(100).required()
        })).min(1).required(),
        durationHours: Joi.number().min(0.1).max(720).required(),
        status: Joi.string().valid('pending', 'active').default('pending')
    });
    return schema.validate(obj);
}

// Validation de mise à jour
function updateFlashOfferVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50),
        title: Joi.string().trim().min(1).max(200),
        products: Joi.array().items(Joi.object({
            productId: Joi.string().required(),
            promoPercentage: Joi.number().min(0).max(100).required()
        })).min(1),
        durationHours: Joi.number().min(0.1).max(720)
    });
    return schema.validate(obj);
}

module.exports = { FlashOffer, createFlashOfferVerify, updateFlashOfferVerify };
