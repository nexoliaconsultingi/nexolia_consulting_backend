const mongoose = require('mongoose');
const Joi = require('joi');

const zoneSchema = new mongoose.Schema({
    depotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Depot',
        required: true
    },
    identifier: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 50
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100
    },
    storageType: {
        type: String,
        enum: ['rack', 'palette', 'bulk', 'cold', 'shelf', 'hazardous'],
        default: 'rack'
    },
    area: {
        type: Number,
        default: 0,
        min: 0
    },
    hasProducts: {
        type: Boolean,
        default: false
    },
    productType: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    },
    storageUnit: {
        type: String,
        enum: ['piece', 'pack', 'palette', 'carton', 'kg', 'litre'],
        default: 'piece'
    }
}, {
    timestamps: true
});

// Un identifiant de zone est unique à l'intérieur d'un même dépôt
zoneSchema.index({ depotId: 1, identifier: 1 }, { unique: true });

const Zone = mongoose.model('Zone', zoneSchema);

// Validation de création
function createZoneVerify(obj) {
    const schema = Joi.object({
        depotId: Joi.string().required(),
        identifier: Joi.string().trim().min(1).max(50).required(),
        name: Joi.string().trim().min(1).max(100).required(),
        storageType: Joi.string().valid('rack', 'palette', 'bulk', 'cold', 'shelf', 'hazardous').default('rack'),
        area: Joi.number().min(0).default(0),
        hasProducts: Joi.boolean().default(false),
        productType: Joi.string().trim().max(200).allow(''),
        storageUnit: Joi.string().valid('piece', 'pack', 'palette', 'carton', 'kg', 'litre').default('piece')
    });
    return schema.validate(obj);
}

// Validation de mise à jour (champs optionnels)
function updateZoneVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50),
        name: Joi.string().trim().min(1).max(100),
        storageType: Joi.string().valid('rack', 'palette', 'bulk', 'cold', 'shelf', 'hazardous'),
        area: Joi.number().min(0),
        hasProducts: Joi.boolean(),
        productType: Joi.string().trim().max(200).allow(''),
        storageUnit: Joi.string().valid('piece', 'pack', 'palette', 'carton', 'kg', 'litre')
    });
    return schema.validate(obj);
}

module.exports = { Zone, createZoneVerify, updateZoneVerify };
