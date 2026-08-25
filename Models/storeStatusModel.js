const mongoose = require('mongoose');
const Joi = require('joi');

// Statut global de la store (singleton — un seul document)
const storeStatusSchema = new mongoose.Schema({
    // La store est-elle active ou en maintenance ?
    isActive: {
        type: Boolean,
        default: true
    },
    // Message affiché aux visiteurs pendant la maintenance
    maintenanceMessage: {
        type: String,
        trim: true,
        maxlength: 500,
        default: 'Notre store est actuellement en maintenance technique. Nous serons de retour très bientôt !'
    }
}, {
    timestamps: true
});

const StoreStatus = mongoose.model('StoreStatus', storeStatusSchema);

// Validation de mise à jour
function updateStoreStatusVerify(obj) {
    const schema = Joi.object({
        isActive: Joi.boolean(),
        maintenanceMessage: Joi.string().trim().max(500).allow('')
    }).min(1);
    return schema.validate(obj);
}

module.exports = { StoreStatus, updateStoreStatusVerify };
