const asyncHandler = require('express-async-handler');
const {FAQ} = require ("../../Models/GestionWebSiteSections/FAQ")
const Joi = require('joi');

// Validation pour création
const createValidate = (data) => {
  const schema = Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required(),
    order: Joi.number().optional(),
  });
  return schema.validate(data);
};

// Validation pour mise à jour
const updateValidate = (data) => {
  const schema = Joi.object({
    question: Joi.string(),
    answer: Joi.string(),
    order: Joi.number(),
  }).min(1);
  return schema.validate(data);
};

/* --------------------------------------------------
 * @desc    Créer une FAQ
 * @route   POST /api/faq/register
 * @access  Privé
 * -------------------------------------------------- */
module.exports.registerFaqCtrl = asyncHandler(async (req, res) => {
  const { error } = createValidate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // Optionnel : vérifier si une FAQ avec la même question existe déjà
  const existing = await FAQ.findOne({ question: req.body.question });
  if (existing) return res.status(400).json({ message: 'Cette question existe déjà' });

  const newFaq = new FAQ(req.body);
  await newFaq.save();
  res.status(201).json({ message: 'FAQ créée avec succès', faq: newFaq });
});

/* --------------------------------------------------
 * @desc    Récupérer toutes les FAQs
 * @route   GET /api/faq/all
 * @access  Public (ou privé selon besoin)
 * -------------------------------------------------- */
module.exports.readAllFaqsCtrl = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 }); // tri par order puis date
  res.status(200).json(faqs);
});

/* --------------------------------------------------
 * @desc    Récupérer une FAQ par ID
 * @route   GET /api/faq/:id
 * @access  Public/Privé
 * -------------------------------------------------- */
module.exports.readOneFaqCtrl = asyncHandler(async (req, res) => {
  const faq = await FAQ.findById(req.params.id);
  if (!faq) return res.status(404).json({ message: 'FAQ non trouvée' });
  res.status(200).json(faq);
});

/* --------------------------------------------------
 * @desc    Mettre à jour une FAQ
 * @route   PUT /api/faq/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.updateFaqCtrl = asyncHandler(async (req, res) => {
  const { error } = updateValidate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const updatedFaq = await FAQ.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!updatedFaq) return res.status(404).json({ message: 'FAQ non trouvée' });
  res.status(200).json({ message: 'FAQ mise à jour', faq: updatedFaq });
});

/* --------------------------------------------------
 * @desc    Supprimer une FAQ
 * @route   DELETE /api/faq/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.deleteFaqCtrl = asyncHandler(async (req, res) => {
  const deleted = await FAQ.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'FAQ non trouvée' });
  res.status(200).json({ message: 'FAQ supprimée' });
});



/* --------------------------------------------------
 * @desc    Create many
 * @route   POST /api/faq/many
 * @access  Privé
 * -------------------------------------------------- */
module.exports.createManyFQA = asyncHandler(async (req, res) => {
  const faqs = req.body;

  if (!Array.isArray(faqs)) {
    return res.status(400).json({ message: "Le body doit être un tableau" });
  }

  const registeredFaqs = await FAQ.insertMany(faqs);

  res.status(201).json({
    message: "FAQs créées avec succès",
    count: registeredFaqs.length,
    data: registeredFaqs,
  });
});