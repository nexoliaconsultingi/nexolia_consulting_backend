const mongoose = require('mongoose');
const Joi = require('joi');

const IMAGE_PREFIXES = ['data:image/webp;base64,', 'data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/jpg;base64,', 'data:image/gif;base64,'];

// Gagnant d'un cadeau (snapshot des informations du client au moment de la déclaration)
const giftWinnerSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        default: null
    },
    name: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 200,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        maxlength: 50,
        default: ''
    },
    address: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    wonAt: {
        type: Date,
        default: null
    }
}, { _id: false });

const giftSchema = new mongoose.Schema({
    // Titre du cadeau / concours (ex : "Concours Ramadan 2026")
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 200
    },
    // Description du cadeau / du concours
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },
    // 3 photos du cadeau (data:image/...;base64,...), chacune max 3 Mo
    images: {
        type: [{
            type: String,
            validate: {
                validator: (v) => typeof v === 'string' && IMAGE_PREFIXES.some((p) => v.startsWith(p)) && v.length <= 3000000,
                message: 'Image du cadeau invalide (data URI valide, max 3 Mo)'
            }
        }],
        validate: {
            validator: (v) => Array.isArray(v) && v.length === 3,
            message: 'Le cadeau doit avoir exactement 3 photos'
        }
    },
    // Valeur du cadeau en dinars
    price: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    // Tags du cadeau (array de caractéristiques / mots-clés, ex : "Concours", "Achat")
    tags: {
        type: [String],
        default: []
    },
    // Le cadeau est-il partagé / affiché sur le site web de la boutique
    published: {
        type: Boolean,
        default: false
    },
    // Date de déclaration du gagnant
    declarationDate: {
        type: Date,
        default: null
    },
    // Texte affiché avant la libération du gagnant (ex : "Il reste juste 5h avant de déclarer...")
    preLiberationText: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    // Date d'affichage du texte avant libération — calculée automatiquement = declarationDate - 5h
    preLiberationDisplayDate: {
        type: Date,
        default: null
    },
    // Gagnant du cadeau (rempli lors de la déclaration du gagnant)
    winner: {
        type: giftWinnerSchema,
        default: null
    },
    // Conditions pour être gagnant (array de strings, ex : "Avoir des achats de plus de 100 DT", "Suivre les réseaux sociaux de Nexolia Store")
    conditions: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

const Gift = mongoose.model('Gift', giftSchema);

// Nettoie un tableau de strings : trim + filtre les lignes vides
function sanitizeStringArray(value) {
    if (!Array.isArray(value)) return [];
    return value
        .map((v) => String(v ?? '').trim())
        .filter((v) => v.length > 0)
        .slice(0, 30);
}

// Vérifie le tableau de photos d'un cadeau : exactement 3 data URI valides (max 3 Mo chacune)
function imagesVerify(images) {
    if (!Array.isArray(images) || images.length !== 3) {
        return 'Le cadeau doit avoir exactement 3 photos';
    }
    for (const img of images) {
        if (typeof img !== 'string' || !IMAGE_PREFIXES.some((p) => img.startsWith(p)) || img.length > 3000000) {
            return 'Chaque photo du cadeau doit être une data URI valide (max 3 Mo)';
        }
    }
    return null;
}

// Calcule la date d'affichage du texte avant libération = declarationDate - 5h
function computePreLiberationDisplayDate(declarationDate) {
    if (!declarationDate) return null;
    const d = new Date(declarationDate);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getTime() - 5 * 60 * 60 * 1000);
}

// Validation de création
function createGiftVerify(obj) {
    const schema = Joi.object({
        title: Joi.string().trim().min(1).max(200).required(),
        description: Joi.string().trim().max(1000).allow('').default(''),
        images: Joi.array().items(Joi.string().trim().min(1).max(3000000)).length(3).required(),
        price: Joi.number().min(0).required(),
        tags: Joi.array().items(Joi.string().trim().max(100).allow('')).default([]),
        published: Joi.boolean().default(false),
        declarationDate: Joi.date().allow(null),
        preLiberationText: Joi.string().trim().max(500).allow('').default(''),
        conditions: Joi.array().items(Joi.string().trim().max(500).allow('')).default([])
    });
    return schema.validate(obj);
}

// Validation de mise à jour (champs optionnels)
function updateGiftVerify(obj) {
    const schema = Joi.object({
        title: Joi.string().trim().min(1).max(200),
        description: Joi.string().trim().max(1000).allow(''),
        images: Joi.array().items(Joi.string().trim().min(1).max(3000000)).length(3),
        price: Joi.number().min(0),
        tags: Joi.array().items(Joi.string().trim().max(100).allow('')),
        published: Joi.boolean(),
        declarationDate: Joi.date().allow(null),
        preLiberationText: Joi.string().trim().max(500).allow(''),
        conditions: Joi.array().items(Joi.string().trim().max(500).allow(''))
    });
    return schema.validate(obj);
}

module.exports = { Gift, createGiftVerify, updateGiftVerify, sanitizeStringArray, imagesVerify, computePreLiberationDisplayDate };
