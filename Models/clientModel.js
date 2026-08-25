const mongoose = require('mongoose');
const Joi = require('joi');

// Client de la boutique (utilisé pour déclarer les gagnants des cadeaux / concours)
const clientSchema = new mongoose.Schema({
    // Nom complet du client
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 200
    },
    // Email du client
    email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 200,
        default: ''
    },
    // Numéro de téléphone du client
    phone: {
        type: String,
        trim: true,
        maxlength: 50,
        default: ''
    },
    // Adresse du client
    address: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    }
}, {
    timestamps: true
});

const Client = mongoose.model('Client', clientSchema);

// Validation de création
function createClientVerify(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().min(1).max(200).required(),
        email: Joi.string().trim().max(200).allow('').default(''),
        phone: Joi.string().trim().max(50).allow('').default(''),
        address: Joi.string().trim().max(500).allow('').default('')
    });
    return schema.validate(obj);
}

module.exports = { Client, createClientVerify };
