const asyncHandler = require('express-async-handler');
const EmailList = require('../../Models/GestionWebSiteSections/EmailList');
const Joi = require('joi');

// Validation pour l'ajout d'un email
const validateEmail = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  });
  return schema.validate(data);
};

// @desc    Ajouter un email à la liste
// @route   POST /api/email-list/register
// @access  Public
module.exports.registerEmailCtrl = asyncHandler(async (req, res) => {
  const { error } = validateEmail(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email } = req.body;

  // Vérifier si l'email existe déjà
  const existing = await EmailList.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Cet email est déjà enregistré' });

  const newEmail = new EmailList({ email });
  await newEmail.save();

  res.status(201).json({
    message: 'Email enregistré avec succès',
    email: newEmail
  });
});

// @desc    Récupérer tous les emails
// @route   GET /api/email-list/all
// @access  Privé (ou public selon besoin, ici on peut le laisser en privé pour éviter les abus)
module.exports.getAllEmailsCtrl = asyncHandler(async (req, res) => {
  const emails = await EmailList.find().sort({ createdAt: -1 });
  res.status(200).json(emails);
});

// @desc    Supprimer un email par son ID
// @route   DELETE /api/email-list/:id
// @access  Privé
module.exports.deleteEmailCtrl = asyncHandler(async (req, res) => {
  const deleted = await EmailList.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Email non trouvé' });
  res.status(200).json({ message: 'Email supprimé avec succès' });
});