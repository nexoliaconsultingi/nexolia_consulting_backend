const mongoose = require('mongoose');
const Joi = require('joi');

// Vidéo publicitaire des articles de la store (affichée sur le site de Nexolia)
const storeVideoSchema = new mongoose.Schema({
    // Titre de la vidéo
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    // Description courte affichée sous la vidéo
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },
    // Lien de la vidéo : URL YouTube (watch / youtu.be / embed) ou URL mp4 directe
    videoUrl: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    // Vidéo visible sur le site public ou non
    active: {
        type: Boolean,
        default: true
    },
    // Produits mis en avant par cette vidéo (un ou plusieurs)
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, {
    timestamps: true
});

const StoreVideo = mongoose.model('StoreVideo', storeVideoSchema);

// Validation de création
function createStoreVideoVerify(obj) {
    const schema = Joi.object({
        title: Joi.string().trim().max(200).required(),
        description: Joi.string().trim().max(1000).allow(''),
        videoUrl: Joi.string().trim().max(1000).required(),
        active: Joi.boolean().default(true),
        products: Joi.array().items(Joi.string().trim().length(24)).default([])
    });
    return schema.validate(obj);
}

// Validation de mise à jour (champs optionnels)
function updateStoreVideoVerify(obj) {
    const schema = Joi.object({
        title: Joi.string().trim().max(200),
        description: Joi.string().trim().max(1000).allow(''),
        videoUrl: Joi.string().trim().max(1000),
        active: Joi.boolean(),
        products: Joi.array().items(Joi.string().trim().length(24))
    }).min(1);
    return schema.validate(obj);
}

module.exports = { StoreVideo, createStoreVideoVerify, updateStoreVideoVerify };
