const mongoose = require("mongoose");

/*----------------------------------
Schema Article
-----------------------------------*/
const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantite: { type: Number, required: true, min: 1 },
  unite: { type: String, required: true },
  prixHT: { type: Number, required: true, min: 0 },
  montantHT: { type: Number, required: true, min: 0 }
});

/*----------------------------------
Schema Facture
-----------------------------------*/
const invoiceSchema = new mongoose.Schema({
  
  // 🔹 Infos Client
  clientName: { type: String, required: true, trim: true },
  clientAddress: { type: String, required: true },
  clientTaxNumber: { type: String, required: true }, // Matricule fiscal
  clientPhone: { type: String },
  clientEmail: { type: String },

  // 🔹 Infos Facture
  invoiceNumber: { type: Number, unique: true }, // auto incrémenté
  invoiceDate: { type: Date, default: Date.now },
  paymentTerms: { type: String }, // ex: 20 jours
  dueDate: { type: Date },

  // 🔹 Articles
  items: [itemSchema],

  // 🔹 Totaux
  totalHT: { type: Number, default: 0 },
  tva: { type: Number, default: 0 }, // ex: 19%
  totalTTC: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);