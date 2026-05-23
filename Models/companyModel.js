const mongoose = require("mongoose");
const Joi = require("joi");

/*----------------------------------
Schema Social Network
-----------------------------------*/
const socialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true }
});

/*----------------------------------
Schema Company (mis à jour)
-----------------------------------*/
const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true }, // rue + code postal + ville
  description: { type: String, trim: true },
  website: { type: String, trim: true },
  cachet: { type: String, trim: true },
  logo: { type: String, trim: true },                    // URL du logo
  city: { type: String, trim: true },
  RIB: { type: String, trim: true, default: null },                      // ville (optionnel si déjà dans address)
  postalCode: { type: String, trim: true },               // code postal
  hours: {                                                 // horaires d'ouverture
    mondayFriday: { type: String, default: "" },
    saturday: { type: String, default: "" },
    sunday: { type: String, default: "" }
  },
  socials: [socialSchema],
  activityZones: [{ type: String, trim: true }],
  services: [{ type: String, trim: true }],
  foundedYear: { type: Number },
  employees: { type: Number },
  matriculeFiscal: { type: String, trim: true },
  isAvailable24h: { type: Boolean, default: false }
}, { timestamps: true });

const Company = mongoose.model("Company", companySchema);

/*----------------------------------
Validation création
-----------------------------------*/
// Validation création
function createCompanyValidation(obj) {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    description: Joi.string().allow(""),
    website: Joi.string().allow(""),
    cachet: Joi.string().allow(""),
    matriculeFiscal: Joi.string().allow(""),
    logo: Joi.string().allow(""),
    city: Joi.string().allow(""),
    postalCode: Joi.string().allow(""),
    RIB: Joi.alternatives().try(
      Joi.string().
      Joi.valid(null, "")
    ).optional(),   // autorise null ou vide
    hours: Joi.object({
      mondayFriday: Joi.string().allow(""),
      saturday: Joi.string().allow(""),
      sunday: Joi.string().allow("")
    }).unknown(true),
    socials: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        url: Joi.string().required()
      }).unknown(true)
    ),
    activityZones: Joi.array().items(Joi.string()),
    services: Joi.array().items(Joi.string()),
    foundedYear: Joi.number(),
    employees: Joi.number(),
    isAvailable24h: Joi.boolean()
  });
  return schema.validate(obj);
}

// Validation Update (optionnelle)
function updateCompanyValidation(obj) {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(200),
    email: Joi.string().trim().email(),
    phone: Joi.string().trim(),
    address: Joi.string().trim(),
    description: Joi.string().allow(""),
    website: Joi.string().allow(""),
    cachet: Joi.string().allow(""),
    logo: Joi.string().allow(""),
    matriculeFiscal: Joi.string().allow(""),
    city: Joi.string().allow(""),
    postalCode: Joi.string().allow(""),
    RIB: Joi.alternatives().try(
      Joi.string(),
      Joi.valid(null, "")
    ).optional(),
    hours: Joi.object({
      mondayFriday: Joi.string().allow(""),
      saturday: Joi.string().allow(""),
      sunday: Joi.string().allow("")
    }).unknown(true),
    socials: Joi.array().items(
      Joi.object({
        title: Joi.string(),
        url: Joi.string()
      }).unknown(true)
    ),
    activityZones: Joi.array().items(Joi.string()),
    services: Joi.array().items(Joi.string()),
    foundedYear: Joi.number(),
    employees: Joi.number(),
    isAvailable24h: Joi.boolean()
  });
  return schema.validate(obj);
}

module.exports = {
  Company,
  createCompanyValidation,
  updateCompanyValidation
};