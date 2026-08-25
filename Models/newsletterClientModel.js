const mongoose = require('mongoose');
const Joi = require('joi');

// Client abonné aux nouveautés / promotions / soldes de Nexolia Store (newsletter)
const newsletterClientSchema = new mongoose.Schema({
    // Nom du client
    name: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    },
    // Email du client (obligatoire : c'est lui qui reçoit les notifications)
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 200
    },
    // Abonnement actif : seuls les abonnés actifs reçoivent les emails
    subscribed: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const NewsletterClient = mongoose.model('NewsletterClient', newsletterClientSchema);

// Validation de création
function createNewsletterClientVerify(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().max(200).allow(''),
        email: Joi.string().trim().max(200).email().required(),
        subscribed: Joi.boolean().default(true)
    });
    return schema.validate(obj);
}

// Validation de mise à jour (champs optionnels)
function updateNewsletterClientVerify(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().max(200).allow(''),
        email: Joi.string().trim().max(200).email(),
        subscribed: Joi.boolean()
    });
    return schema.validate(obj);
}

module.exports = { NewsletterClient, createNewsletterClientVerify, updateNewsletterClientVerify };
