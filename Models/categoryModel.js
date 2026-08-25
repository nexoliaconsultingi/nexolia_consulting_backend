const mongoose = require('mongoose');
const Joi = require('joi');

const IMAGE_PREFIXES = ['data:image/webp;base64,', 'data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/jpg;base64,', 'data:image/gif;base64,'];

const categorySchema = new mongoose.Schema({
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
        minlength: 1,
        maxlength: 100
    },
    // Icône (nom d'icône lucide) affichée dans l'interface
    icon: {
        type: String,
        trim: true,
        default: 'Tags',
        maxlength: 50
    },
    // Image de la catégorie, stockée en base64 (data:image/...;base64,...) — max 3 Mo
    image: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

// Vérifie qu'une valeur est une image data URI valide (max 3 Mo)
function imageVerify(value) {
    if (typeof value !== 'string') return null;
    if (value === '') return null;
    if (!IMAGE_PREFIXES.some((p) => value.startsWith(p)) || value.length > 3000000) {
        return "L'image de la catégorie doit être une data URI valide (max 3 Mo)";
    }
    return null;
}

// Validation de création
function createCategoryVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50).required(),
        name: Joi.string().trim().min(1).max(100).required(),
        icon: Joi.string().trim().min(1).max(50).default('Tags'),
        image: Joi.string().trim().max(3000000).allow('').default('')
    });
    return schema.validate(obj);
}

// Validation de mise à jour (champs optionnels)
function updateCategoryVerify(obj) {
    const schema = Joi.object({
        identifier: Joi.string().trim().min(1).max(50),
        name: Joi.string().trim().min(1).max(100),
        icon: Joi.string().trim().min(1).max(50),
        image: Joi.string().trim().max(3000000).allow('')
    });
    return schema.validate(obj);
}

module.exports = { Category, createCategoryVerify, updateCategoryVerify, imageVerify };
