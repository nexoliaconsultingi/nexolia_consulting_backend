const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({

  // 🔹 Informations personnelles
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },

  // 🔹 Adresse client
  addressClient: { 
    type: String, 
    required: true, 
    trim: true 
  },

  // 🔥 Matricule fiscal TN
  matriculeFiscaleClient: { 
    type: String,
    trim: true,
    uppercase: true,
    match: /^[0-9]{6,7}[A-Z]\/[A-Z]\/[A-Z]\/[0-9]{3}$/,
   
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

  // 🔥 TABLEAU FACTURE
  items: [
    {
      description: { type: String, required: true },

      quantite: { type: Number, required: true, min: 1 },

      unite: { type: String, default: "Allers-Retours" },

      prixHT: { type: Number, required: true, min: 0 },

      montantTotalHT: { type: Number }
    }
  ],

  // 🔹 Prix globaux
  priceHT: { type: Number, min: 0 },
  tvaRate: { type: Number, min: 0, default: 19 },
  priceTTC: { type: Number, min: 0 },
  timbre: {type:Number, default:0},

  // 🔹 Dates
  dateFacture: { 
    type: Date, 
    default: Date.now 
  },

  NombreJourePayement: { 
    type: Number, 
    default: 0 
  },

  dateEcheancie: { 
    type: Date 
  },

  // 🔥 Numéro facture (⚠️ sans default si tu veux auto increment après)
  Numerofacture: {
    type: String
  }

}, {
  timestamps: true
});


// 🔥 Middleware GLOBAL
factureSchema.pre('save', function(next) {

  // ✅ 1. Calcul date échéance
  if (this.dateFacture && this.NombreJourePayement != null) {
    const date = new Date(this.dateFacture);
    date.setDate(date.getDate() + this.NombreJourePayement);
    this.dateEcheancie = date;
  }

  // ✅ 2. Calcul lignes facture
  if (this.items && this.items.length > 0) {

    this.items.forEach(item => {
      item.montantTotalHT = item.quantite * item.prixHT;
    });

    // 🔥 Total HT
    this.priceHT = this.items.reduce((total, item) => {
      return total + item.montantTotalHT;
    }, 0);

    // 🔥 Total TTC
    this.priceTTC = this.priceHT + (this.priceHT * this.tvaRate / 100);
  }

  next();
});


module.exports = mongoose.model('Facture', factureSchema);