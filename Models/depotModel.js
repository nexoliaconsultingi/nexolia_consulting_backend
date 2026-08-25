const mongoose = require('mongoose');
const Joi = require('joi');

const depotSchema = new mongoose.Schema({
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
        minlength: 2,
        maxlength: 100
    },
    address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    area: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'construction'],
        default: 'inactive'
    },
    responsableName: {
        type: String,
        trim: true,
        default: ''
    },
    responsableEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    responsablePhone: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

const Depot = mongoose.model('Depot', depotSchema);

// Validation de création
function createDepotVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50).required(),
        name: Joi.string().trim().min(2).max(100).required(),
        address: Joi.string().trim().max(255).required(),
        area: Joi.number().min(0).default(0),
        status: Joi.string().valid('active', 'inactive', 'construction').default('inactive'),
        responsableName: Joi.string().trim().max(100).allow(''),
        responsableEmail: Joi.string().trim().max(100).email().allow(''),
        responsablePhone: Joi.string().trim().max(30).allow('')
    });
    return schema.validate(obj);
}

// Validation de mise à jour (champs optionnels)
function updateDepotVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50),
        name: Joi.string().trim().min(2).max(100),
        address: Joi.string().trim().max(255),
        area: Joi.number().min(0),
        status: Joi.string().valid('active', 'inactive', 'construction'),
        responsableName: Joi.string().trim().max(100).allow(''),
        responsableEmail: Joi.string().trim().max(100).email().allow(''),
        responsablePhone: Joi.string().trim().max(30).allow('')
    });
    return schema.validate(obj);
}

module.exports = { Depot, createDepotVerify, updateDepotVerify };
