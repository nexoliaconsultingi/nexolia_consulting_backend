const mongoose = require('mongoose');

const EmailListSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Veuillez fournir un email valide']
  }
}, { timestamps: true }); // ajoute createdAt et updatedAt automatiquement

const EmailList = mongoose.model('EmailList', EmailListSchema);

module.exports = EmailList;