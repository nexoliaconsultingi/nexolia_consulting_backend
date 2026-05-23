const { boolean } = require('joi');
const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({

  // 🔹 Informations personnelles
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  goToFacturation: { 
  type: Boolean, 
  default: false,
  index: true
},

  // 🔹 Adresse client
  addressClient: { 
    type: String, 
    required: true, 
    trim: true 
  },

  // 🔥 Matricule fiscal TN (VALIDÉ)
 matriculeFiscaleClient: { 
  type: String,
  trim: true,
  uppercase: true,
  match: /^[0-9]{6,7}[A-Z]\/[A-Z]\/[A-Z]\/[0-9]{3}$/,
  unique: true,
  sparse: true
},

  // 🔹 Type de service
  moveType: {
    type: String,
    enum: ['residential', 'commercial', 'storage', 'cleaning'],
    required: true
  },

  // 🔹 Adresses
  pickupAddress: { type: String, trim: true },
  pickupFloors: { type: Number, min: 0 },
  pickupElevator: { type: String, enum: ['oui', 'non'] },

  deliveryAddress: { type: String, trim: true },
  deliveryFloors: { type: Number, min: 0 },
  deliveryElevator: { type: String, enum: ['oui', 'non'] },

  // 🔹 Nettoyage
  cleaningAddress: { type: String, trim: true },
  cleaningType: { type: String, enum: ['entreprise', 'appartement'] },
  cleaningFloors: { type: Number, min: 0 },

  cleaningInclusions: {
    jardin: { type: Boolean, default: false },
    meuble: { type: Boolean, default: false },
    mur: { type: Boolean, default: false }
  },

  // 🔹 Stockage
  storageItemType: { type: String, trim: true },
  storageStartDate: { type: Date },
  storageEndDate: { type: Date },

  // 🔹 Dates
  quoteDate: { type: Date },
  moveStartDate: { type: Date },

  // 🔹 Message
  additionalInfo: { type: String, trim: true },

  // 🔹 Statut
  status: {
    type: String,
    enum: ['pending', 'contacted', 'completed', 'cancelled', 'validated'],
    default: 'pending'
  },

  // 🔹 Admin
  price: { type: Number, min: 0 },
  estimatedDays: { type: Number, min: 1 },
  adminComment: { type: String },

  // 🔹 TVA (Tunisie 🇹🇳)
  priceHT: { type: Number, min: 0 },
  tvaRate: { type: Number, min: 0, default: 19 },
  priceTTC: { type: Number, min: 0 }, 


  isFactured:{ type: Boolean, default: false }

}, {
  timestamps: true // 🔥 remplace createdAt + updatedAt automatiquement
});


// 🔥 VALIDATION AVANCÉE (dates stockage)
quoteSchema.pre('validate', function (next) {
  if (this.storageStartDate && this.storageEndDate) {
    if (this.storageEndDate < this.storageStartDate) {
      return next(new Error('storageEndDate doit être supérieure à storageStartDate'));
    }
  }
  next();
});


// 🔥 AUTO FORMAT + CALCUL
quoteSchema.pre('save', function (next) {

  // Matricule fiscal en uppercase propre
  if (this.matriculeFiscaleClient) {
    this.matriculeFiscaleClient = this.matriculeFiscaleClient.trim().toUpperCase();
  }

  // Calcul TTC sécurisé
  if (this.priceHT !== undefined && this.tvaRate !== undefined) {
    this.priceTTC = this.priceHT + (this.priceHT * this.tvaRate / 100);
  }

  next();
});


// 🔥 INDEX (performance + recherche)
quoteSchema.index({ status: 1 });
quoteSchema.index({ moveType: 1 });
quoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Quote', quoteSchema);