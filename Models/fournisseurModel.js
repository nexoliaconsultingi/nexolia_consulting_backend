const mongoose = require('mongoose');
const Joi = require('joi');

const fournisseurSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    active: {
        type: Boolean,
        default: false
    },
    turnover: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

const Fournisseur = mongoose.model('Fournisseur', fournisseurSchema);

// Validation de création
function createFournisseurVerify(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        address: Joi.string().trim().max(255).required(),
        description: Joi.string().trim().max(500).allow(''),
        email: Joi.string().trim().max(100).email().required(),
        phone: Joi.string().trim().max(30).allow(''),
        active: Joi.boolean().default(false),
        turnover: Joi.number().min(0).default(0)
    });
    return schema.validate(obj);
}

// Validation de mise à jour (champs optionnels)
function updateFournisseurVerify(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(100),
        address: Joi.string().trim().max(255),
        description: Joi.string().trim().max(500).allow(''),
        email: Joi.string().trim().max(100).email(),
        phone: Joi.string().trim().max(30).allow(''),
        active: Joi.boolean(),
        turnover: Joi.number().min(0)
    });
    return schema.validate(obj);
}

module.exports = { Fournisseur, createFournisseurVerify, updateFournisseurVerify };
