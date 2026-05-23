const asyncHandler = require("express-async-handler");
const { Service } = require("../../Models/GestionWebSiteSections/Service");
const Joi = require('joi');

// Validation pour la création
const registerValidate = (data) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    images: Joi.array().items(Joi.string().uri()).min(1).required(),
    keywords: Joi.array().items(Joi.string()).optional(),
  });
  return schema.validate(data);
};

// Validation pour la mise à jour (champs optionnels)
const updateValidate = (data) => {
  const schema = Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    images: Joi.array().items(Joi.string().uri()).min(1),
    keywords: Joi.array().items(Joi.string()),
  }).min(1);
  return schema.validate(data);
};

/* --------------------------------------------------
 * @desc    Créer un service
 * @route   POST /api/service/register
 * @access  Privé
 * -------------------------------------------------- */
module.exports.registerServiceCtrl = asyncHandler(async (req, res) => {
  const { error } = registerValidate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const existing = await Service.findOne({ title: req.body.title });
  if (existing) {
    return res.status(400).json({ message: "Ce service existe déjà." });
  }

  const newService = new Service(req.body);
  await newService.save();

  res.status(201).json({ message: "Service créé avec succès", service: newService });
});

/* --------------------------------------------------
 * @desc    Mettre à jour un service
 * @route   PUT /api/service/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.updateServiceCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = updateValidate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const service = await Service.findById(id);
  if (!service) {
    return res.status(404).json({ message: "Service non trouvé" });
  }

  const updatedService = await Service.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json({ message: "Service mis à jour", service: updatedService });
});

/* --------------------------------------------------
 * @desc    Supprimer un service
 * @route   DELETE /api/service/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.deleteServiceCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);
  if (!service) {
    return res.status(404).json({ message: "Service non trouvé" });
  }

  await Service.findByIdAndDelete(id);

  res.status(200).json({ message: "Service supprimé avec succès" });
});

/* --------------------------------------------------
 * @desc    Récupérer un service par ID
 * @route   GET /api/service/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.readOneService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);
  if (!service) {
    return res.status(404).json({ message: "Service non trouvé" });
  }

  res.status(200).json(service);
});

/* --------------------------------------------------
 * @desc    Récupérer tous les services
 * @route   GET /api/service/all
 * @access  Public (ou privé selon besoin)
 * -------------------------------------------------- */
module.exports.readAllServices = asyncHandler(async (req, res) => {
  const services = await Service.find().sort({ createdAt: -1 });
  res.status(200).json(services);
});