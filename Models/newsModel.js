const mongoose = require('mongoose');
const Joi = require('joi');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        enum: ['Offre', 'Actualité', 'Conseils'] // Vous pouvez ajouter d'autres catégories
    },
    date: {
        type: String,
        required: true,
        trim: true
    },
    endDateOfOffre: {
        type: String,
        trim: true,
        default: null
    },
    excerpt: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const News = mongoose.model('News', newsSchema);

// Validation pour la création
function validateCreateNews(obj) {
    const schema = Joi.object({
        title: Joi.string().trim().required(),
        category: Joi.string().trim().required().valid('Offre', 'Actualité', 'Conseils'),
        date: Joi.string().trim().required(),
        endDateOfOffre: Joi.string().trim().allow('', null),
        excerpt: Joi.string().trim().required(),
        content: Joi.string().trim().allow('', null),
        image: Joi.string().trim().required(),
        isFeatured: Joi.boolean().optional()
    });
    return schema.validate(obj);
}

// Validation pour la mise à jour (tous les champs sont optionnels)
function validateUpdateNews(obj) {
    const schema = Joi.object({
        title: Joi.string().trim(),
        category: Joi.string().trim().valid('Offre', 'Actualité', 'Conseils'),
        date: Joi.string().trim(),
        endDateOfOffre: Joi.string().trim().allow('', null),
        excerpt: Joi.string().trim(),
        content: Joi.string().trim().allow('', null),
        image: Joi.string().trim(),
        isFeatured: Joi.boolean()
    });
    return schema.validate(obj);
}

module.exports = {
    News,
    validateCreateNews,
    validateUpdateNews
};