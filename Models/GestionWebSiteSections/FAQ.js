const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  order: { type: Number, default: 0 }, // optionnel pour tri personnalisé
}, { timestamps: true });

const FAQ = mongoose.model('FAQ', FAQSchema);

module.exports = { FAQ };