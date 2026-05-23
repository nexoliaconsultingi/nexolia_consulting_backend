const asyncHandler = require("express-async-handler");
const { Partner } = require("../../Models/GestionWebSiteSections/Partner");
const Joi = require('joi');

// Schémas de validation (définis ci-dessus ou importés)
const registerValidate = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    sector: Joi.string().required(),
    description: Joi.string().required(),
    logo: Joi.string().uri().required(),
    year: Joi.string().required(),
    testimonial: Joi.string().required(),
    bgGradient: Joi.string().required(),
  });
  return schema.validate(data);
};

const updateValidate = (data) => {
  const schema = Joi.object({
    name: Joi.string(),
    sector: Joi.string(),
    description: Joi.string(),
    logo: Joi.string().uri(),
    year: Joi.string(),
    testimonial: Joi.string(),
    bgGradient: Joi.string(),
  }).min(1);
  return schema.validate(data);
};

/* --------------------------------------------------
 * @desc    Créer un nouveau partenaire
 * @route   POST /api/partner/register
 * @access  Privé
 * -------------------------------------------------- */
module.exports.registerPartnerCtrl = asyncHandler(async (req, res) => {
  // Validation des données
  const { error } = registerValidate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Vérifier si le partenaire existe déjà (par nom)
  const existingPartner = await Partner.findOne({ name: req.body.name });
  if (existingPartner) {
    return res.status(400).json({ message: "Ce partenaire existe déjà" });
  }

  // Création
  const newPartner = new Partner(req.body);
  await newPartner.save();

  res.status(201).json({
    message: "Partenaire créé avec succès",
    partner: newPartner,
  });
});

/* --------------------------------------------------
 * @desc    Mettre à jour un partenaire
 * @route   PUT /api/partner/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.updatePartnerCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validation des données à mettre à jour
  const { error } = updateValidate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Vérifier l'existence
  const partner = await Partner.findById(id);
  if (!partner) {
    return res.status(404).json({ message: "Partenaire non trouvé" });
  }

  // Mise à jour
  const updatedPartner = await Partner.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    message: "Partenaire mis à jour avec succès",
    partner: updatedPartner,
  });
});

/* --------------------------------------------------
 * @desc    Supprimer un partenaire
 * @route   DELETE /api/partner/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.deletePartnerCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.findById(id);
  if (!partner) {
    return res.status(404).json({ message: "Partenaire non trouvé" });
  }

  await Partner.findByIdAndDelete(id);

  res.status(200).json({ message: "Partenaire supprimé avec succès" });
});

/* --------------------------------------------------
 * @desc    Récupérer un partenaire par ID
 * @route   GET /api/partner/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.readOnePartner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.findById(id);
  if (!partner) {
    return res.status(404).json({ message: "Partenaire non trouvé" });
  }

  res.status(200).json(partner);
});

/* --------------------------------------------------
 * @desc    Récupérer tous les partenaires
 * @route   GET /api/partner/all
 * @access  Privé
 * -------------------------------------------------- */
module.exports.readAllPartners = asyncHandler(async (req, res) => {
  const partners = await Partner.find().sort({ createdAt: -1 });
  res.status(200).json(partners);
});