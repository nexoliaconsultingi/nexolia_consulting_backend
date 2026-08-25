const mongoose = require('mongoose');
const Joi = require('joi');

// Snapshot d'un produit dans la commande (les infos sont figées au moment de la commande)
const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    identifier: { type: String, default: '' },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    colorName: { type: String, default: '' },
    colorHex: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    // Remise appliquée sur cette ligne (code de remise)
    discount: { type: Number, default: 0, min: 0 },
    // Produits inclus (packages)
    includedProducts: [{
        name: { type: String, default: '' },
        image: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
    }],
}, { _id: false });

const orderSchema = new mongoose.Schema({
    // Informations du client
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, default: '', maxlength: 1000 },

    // Produits commandés
    items: {
        type: [orderItemSchema],
        validate: v => Array.isArray(v) && v.length > 0,
    },

    // Totaux
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    promoCode: { type: String, trim: true, uppercase: true, default: '', maxlength: 30 },

    // Statut : nouveau | confirmer | livraison | terminer | retour
    status: {
        type: String,
        enum: ['nouveau', 'confirmer', 'livraison', 'terminer', 'retour'],
        default: 'nouveau',
    },

    // Agence de livraison liée à la commande
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgency', default: null },
}, {
    timestamps: true
});

// Index pour trier/filtrer rapidement
orderSchema.index({ status: 1, createdAt: -1 });

// Validation de création
function createOrderVerify(obj) {
    const schema = Joi.object({
        firstName: Joi.string().trim().min(2).max(100).required(),
        lastName: Joi.string().trim().min(2).max(100).required(),
        phone: Joi.string().trim().min(8).max(30).required(),
        address: Joi.string().trim().min(5).max(500).required(),
        notes: Joi.string().trim().allow('').max(1000).default(''),
        items: Joi.array().items(Joi.object({
            productId: Joi.string().allow('', null).default(null),
            identifier: Joi.string().trim().allow('').max(50).default(''),
            name: Joi.string().trim().min(1).max(200).required(),
            image: Joi.string().allow('').max(500000).default(''),
            colorName: Joi.string().trim().allow('').max(50).default(''),
            colorHex: Joi.string().trim().allow('').max(20).default(''),
            unitPrice: Joi.number().min(0).required(),
            quantity: Joi.number().integer().min(1).max(9999).required(),
            discount: Joi.number().min(0).default(0),
            includedProducts: Joi.array().items(Joi.object({
                name: Joi.string().trim().allow('').max(200).default(''),
                image: Joi.string().allow('').max(500000).default(''),
                quantity: Joi.number().integer().min(1).default(1),
            })).default([]),
        })).min(1).required(),
        subtotal: Joi.number().min(0).required(),
        discountTotal: Joi.number().min(0).default(0),
        total: Joi.number().min(0).required(),
        promoCode: Joi.string().trim().uppercase().allow('').max(30).default(''),
    });
    return schema.validate(obj);
}

// Validation de mise à jour (statut + infos client modifiables)
function updateOrderVerify(obj) {
    const schema = Joi.object({
        status: Joi.string().valid('nouveau', 'confirmer', 'livraison', 'terminer', 'retour'),
        firstName: Joi.string().trim().min(2).max(100),
        lastName: Joi.string().trim().min(2).max(100),
        phone: Joi.string().trim().min(8).max(30),
        address: Joi.string().trim().min(5).max(500),
        notes: Joi.string().trim().allow('').max(1000),
        agencyId: Joi.alternatives().try(Joi.string(), Joi.valid(null)),
    }).min(1);
    return schema.validate(obj);
}

module.exports = { Order: mongoose.model('Order', orderSchema), createOrderVerify, updateOrderVerify };
