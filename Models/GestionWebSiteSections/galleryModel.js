const mongoose = require('mongoose');
const Joi = require('joi');

const gallerySchema = new mongoose.Schema({
    src: {
        type: String,
        required: true,
        trim: true
    },
    alt: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,   // tu peux aussi utiliser Date si tu préfères
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

const Gallery = mongoose.model('Gallery', gallerySchema);

// Validation pour la création
function validateCreateGallery(obj) {
    const schema = Joi.object({
        src: Joi.string().trim().required(),
        alt: Joi.string().trim().required(),
        category: Joi.string().trim().required(),
        location: Joi.string().trim().required(),
        date: Joi.string().trim().required()
    });
    return schema.validate(obj);
}

// Validation pour la mise à jour (tous les champs sont optionnels)
function validateUpdateGallery(obj) {
    const schema = Joi.object({
        src: Joi.string().trim(),
        alt: Joi.string().trim(),
        category: Joi.string().trim(),
        location: Joi.string().trim(),
        date: Joi.string().trim()
    });
    return schema.validate(obj);
}

module.exports = {
    Gallery,
    validateCreateGallery,
    validateUpdateGallery
};