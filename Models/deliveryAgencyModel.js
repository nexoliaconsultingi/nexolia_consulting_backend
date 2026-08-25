const mongoose = require('mongoose');
const Joi = require('joi');

const deliveryAgencySchema = new mongoose.Schema({
    // Nom de l'agence de livraison
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    // Localisation (ville / zone couverte)
    location: { type: String, required: true, trim: true, maxlength: 300 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200, default: '' },
    // Frais facturés par l'agence
    deliveryFee: { type: Number, default: 0, min: 0 },   // frais de livraison
    tourFee: { type: Number, default: 0, min: 0 },       // frais de tournée
    active: { type: Boolean, default: true },
}, {
    timestamps: true
});

// Validation de création
function createDeliveryAgencyVerify(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(150).required(),
        location: Joi.string().trim().min(2).max(300).required(),
        phone: Joi.string().trim().min(8).max(30).required(),
        email: Joi.string().trim().email().allow('').max(200).default(''),
        deliveryFee: Joi.number().min(0).default(0),
        tourFee: Joi.number().min(0).default(0),
        active: Joi.boolean().default(true),
    });
    return schema.validate(obj);
}

// Validation de mise à jour
function updateDeliveryAgencyVerify(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(150),
        location: Joi.string().trim().min(2).max(300),
        phone: Joi.string().trim().min(8).max(30),
        email: Joi.string().trim().email().allow('').max(200),
        deliveryFee: Joi.number().min(0),
        tourFee: Joi.number().min(0),
        active: Joi.boolean(),
    }).min(1);
    return schema.validate(obj);
}

module.exports = { DeliveryAgency: mongoose.model('DeliveryAgency', deliveryAgencySchema), createDeliveryAgencyVerify, updateDeliveryAgencyVerify };
