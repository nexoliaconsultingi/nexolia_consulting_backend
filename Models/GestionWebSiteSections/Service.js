const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String, required: true }], // Tableau d'URLs d'images
  keywords: [{ type: String }], // Tableau de mots-clés (optionnel)
}, { timestamps: true });

const Service = mongoose.model('Service', ServiceSchema);

module.exports = { Service };