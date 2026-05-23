// Models/GestionWebSiteSections/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true },
  // Si pas d'image, on utilisera une image par défaut (icône profil)
  profileImage: { type: String, default: '' }, // optionnel, si fourni
  service: { type: String, required: true }, // le service concerné
  reviewText: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  city: { type: String, required: true },
  isValidated: { type: Boolean, default: false }, // par défaut non validé
}, { timestamps: true });

const Review = mongoose.model('Review', ReviewSchema);

module.exports = { Review };