const mongoose = require('mongoose');
const Joi = require('joi');

const PartnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sector: { type: String, required: true },
    description: { type: String, required: true },
    logo: { type: String, required: true }, // URL de l'image
    year: { type: String, required: true },
    testimonial: { type: String, required: true },
    bgGradient: { type: String, required: true }, // ex: "from-purple-500/10 to-pink-500/10"
}
    , {
        timestamps: true
    });

const Partner = mongoose.model('Partner', PartnerSchema);




module.exports = {
    Partner
};
