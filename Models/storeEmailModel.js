const mongoose = require('mongoose');
const Joi = require('joi');

// Historique des emails de newsletter envoyés aux clients de Nexolia Store
const storeEmailSchema = new mongoose.Schema({
    // Objet de l'email
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    // Contenu texte brut de l'email
    content: {
        type: String,
        required: true,
        maxlength: 20000
    },
    // Contenu HTML complet envoyé
    contentHtml: {
        type: String,
        maxlength: 100000,
        default: ''
    },
    // URL de l'image incluse dans l'email (promo / visuel)
    // Peut contenir un data URI base64 volumineux, d'où une limite élevée
    imageUrl: {
        type: String,
        trim: true,
        maxlength: 500000,
        default: ''
    },
    // Lien vers l'offre / promotion
    offerUrl: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },
    // Signature de Nexolia Store affichée en bas de l'email
    signature: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: ''
    },
    // Nombre de destinataires ayant reçu l'email
    recipientCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Liste des emails des destinataires
    recipientEmails: {
        type: [String],
        default: []
    },
    // Nom de l'utilisateur (admin / store) ayant envoyé
    sentBy: {
        type: String,
        default: ''
    },
    // Id de l'utilisateur ayant envoyé
    sentById: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const StoreEmail = mongoose.model('StoreEmail', storeEmailSchema);

// Validation de création
function createStoreEmailVerify(obj) {
    const schema = Joi.object({
        subject: Joi.string().trim().max(300).required(),
        content: Joi.string().max(20000).required(),
        contentHtml: Joi.string().max(100000).allow(''),
        imageUrl: Joi.string().trim().max(500000).allow(''),
        offerUrl: Joi.string().trim().max(1000).allow(''),
        signature: Joi.string().trim().max(5000).allow(''),
        recipientCount: Joi.number().min(0).default(0),
        recipientEmails: Joi.array().items(Joi.string().trim().max(200)).default([]),
        sentBy: Joi.string().trim().max(200).allow(''),
        sentById: Joi.string().trim().max(100).allow('')
    });
    return schema.validate(obj);
}

module.exports = { StoreEmail, createStoreEmailVerify };
