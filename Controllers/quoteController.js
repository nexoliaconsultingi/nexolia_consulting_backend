const asyncHandler = require('express-async-handler');
const Quote = require('../Models/Quote');
const Joi = require('joi');
const { sendNewQuoteNotification } = require('../SendMailNodeMailer/emailService');

// Schéma de validation Joi
const quoteValidationSchema = Joi.object({
  firstName: Joi.string().required(),
  
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),

  addressClient: Joi.string().min(5).required(),

  matriculeFiscaleClient: Joi.string()
    .uppercase()
    .pattern(/^[0-9]{6,7}[A-Z]\/[A-Z]\/[A-Z]\/[0-9]{3}$/)
    .allow('', null)
    .optional(),

  priceHT: Joi.number().min(0).optional(),
  tvaRate: Joi.number().min(0).max(100).optional(),

  price: Joi.number().min(0).optional(),
  estimatedDays: Joi.number().integer().min(1).optional(),
  adminComment: Joi.string().allow('').optional(),

  moveType: Joi.string().valid('residential', 'commercial', 'storage', 'cleaning').required(),

  pickupAddress: Joi.when('moveType', {
    is: Joi.valid('residential', 'commercial', 'storage'),
    then: Joi.string().required()
  }),

  deliveryAddress: Joi.when('moveType', {
    is: Joi.valid('residential', 'commercial'),
    then: Joi.string().required()
  }),

  pickupFloors: Joi.number().integer().optional(),
  pickupElevator: Joi.string().valid('oui', 'non').optional(),
  deliveryFloors: Joi.number().integer().optional(),
  deliveryElevator: Joi.string().valid('oui', 'non').optional(),

  cleaningAddress: Joi.when('moveType', { is: 'cleaning', then: Joi.string().required() }),
  cleaningType: Joi.when('moveType', {
    is: 'cleaning',
    then: Joi.string().valid('entreprise', 'appartement').required()
  }),

  cleaningFloors: Joi.number().integer().optional(),

  cleaningInclusions: Joi.object({
    jardin: Joi.boolean(),
    meuble: Joi.boolean(),
    mur: Joi.boolean()
  }).optional(),

  storageItemType: Joi.when('moveType', { is: 'storage', then: Joi.string().required() }),
  storageStartDate: Joi.when('moveType', { is: 'storage', then: Joi.date().required() }),
  storageEndDate: Joi.when('moveType', { is: 'storage', then: Joi.date().required() }),

  quoteDate: Joi.date().optional(),
  moveStartDate: Joi.date().optional(),
  additionalInfo: Joi.string().allow('').optional()
});




const quoteUpdateSchema = Joi.object({

  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
 

  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),

  addressClient: Joi.string().min(5).optional(),

  matriculeFiscaleClient: Joi.string()
    .uppercase()
    .pattern(/^[0-9]{6,7}[A-Z]\/[A-Z]\/[A-Z]\/[0-9]{3}$/)
    .allow('', null)
    .optional(),

  priceHT: Joi.number().min(0).optional(),
  tvaRate: Joi.number().min(0).max(100).optional(),

  price: Joi.number().min(0).optional(),
  estimatedDays: Joi.number().integer().min(1).optional(),
  adminComment: Joi.string().allow('').optional(),

  moveType: Joi.string().valid('residential', 'commercial', 'storage', 'cleaning').optional(),

  pickupAddress: Joi.string().optional(),
  deliveryAddress: Joi.string().optional(),

  pickupFloors: Joi.number().integer().optional(),
  pickupElevator: Joi.string().valid('oui', 'non').optional(),
  deliveryFloors: Joi.number().integer().optional(),
  deliveryElevator: Joi.string().valid('oui', 'non').optional(),

  cleaningAddress: Joi.string().optional(),
  cleaningType: Joi.string().valid('entreprise', 'appartement').optional(),
  cleaningFloors: Joi.number().integer().optional(),

  cleaningInclusions: Joi.object({
    jardin: Joi.boolean(),
    meuble: Joi.boolean(),
    mur: Joi.boolean()
  }).optional(),

  storageItemType: Joi.string().optional(),
  storageStartDate: Joi.date().optional(),
  storageEndDate: Joi.date().optional(),

  quoteDate: Joi.date().optional(),
  moveStartDate: Joi.date().optional(),
  additionalInfo: Joi.string().allow('').optional()

});





/**
 * @desc    Créer un nouveau devis
 * @route   POST /api/quote
 * @access  Public
 */
module.exports.createQuoteCtrl = asyncHandler(async (req, res) => {
  const { error, value } = quoteValidationSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: error.details.map(d => d.message).join(', ')
    });
  }

  // 🔥 Nettoyage
  if (value.matriculeFiscaleClient) {
    value.matriculeFiscaleClient = value.matriculeFiscaleClient.trim().toUpperCase();
  } else {
    value.matriculeFiscaleClient = null;
  }

  try {
    const quote = await Quote.create(value);

    try {
      await sendNewQuoteNotification(quote);
    } catch (e) {
      console.error('Erreur email:', e);
    }

    res.status(201).json({
      message: 'Devis créé avec succès',
      quoteId: quote._id
    });

  } catch (err) {

    // 🔥 Gestion duplication matricule fiscal
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Ce matricule fiscal existe déjà'
      });
    }

    throw err;
  }
});

// Optionnel : ajouter des fonctions pour l'admin (lister, voir, modifier)



/**
 * @desc    Récupérer tous les devis (avec pagination et filtres)
 * @route   GET /api/quote
 * @access  Privé (admin)
 */
module.exports.getAllQuotesCtrl = asyncHandler(async (req, res) => {

  let { page = 1, limit = 10, status, moveType, startDate, endDate } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  let filter = {};

  if (status) filter.status = status;
  if (moveType) filter.moveType = moveType;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const quotes = await Quote.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean(); // 🔥 IMPORTANT

  const total = await Quote.countDocuments(filter);

  // 🔥 Ajout fallback pour anciens documents
  const formattedQuotes = quotes.map(q => ({
    ...q,
    addressClient: q.addressClient || 'Non défini',
    matriculeFiscaleClient: q.matriculeFiscaleClient || null
  }));

  res.json({
    quotes: formattedQuotes,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  });

});






/**
 * @desc    Récupérer un devis par son ID
 * @route   GET /api/quote/:id
 * @access  Privé (admin)
 */
module.exports.getOneQuoteCtrl = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) {
    return res.status(404).json({ message: 'Devis non trouvé' });
  }
  res.json(quote);
});













/**
 * @desc    Mettre à jour un devis (tous les champs ou partiellement)
 * @route   PUT /api/quote/:id
 * @access  Privé (admin)
 */
module.exports.updateQuoteCtrl = asyncHandler(async (req, res) => {

  const quote = await Quote.findById(req.params.id);
  if (!quote) {
    return res.status(404).json({ message: 'Devis non trouvé' });
  }

  const { error, value } = quoteUpdateSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: error.details.map(d => d.message).join(', ')
    });
  }

  // 🔥 nettoyage
  if (value.matriculeFiscaleClient !== undefined) {
    value.matriculeFiscaleClient = value.matriculeFiscaleClient
      ? value.matriculeFiscaleClient.trim().toUpperCase()
      : null;
  }

  try {
    Object.assign(quote, value);
    await quote.save();

    res.json({
      message: 'Devis mis à jour avec succès',
      quote
    });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Matricule fiscal déjà utilisé'
      });
    }

    throw err;
  }
});
















/**
 * @desc    Changer le statut d'un devis
 * @route   PATCH /api/quote/:id/status
 * @access  Privé (admin)
 */
module.exports.changeQuoteStatusCtrl = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['pending', 'contacted', 'completed', 'cancelled', 'validated'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }

  const quote = await Quote.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!quote) {
    return res.status(404).json({ message: 'Devis non trouvé' });
  }

  res.json({ message: 'Statut mis à jour', quote });
});














/**
 * @desc    Supprimer un devis
 * @route   DELETE /api/quote/:id
 * @access  Privé (admin)
 */
module.exports.deleteQuoteCtrl = asyncHandler(async (req, res) => {
  const quote = await Quote.findByIdAndDelete(req.params.id);

  if (!quote) {
    return res.status(404).json({ message: 'Devis non trouvé' });
  }

  res.json({ message: 'Devis supprimé' });
});











module.exports.getQuoteStatsCtrl = asyncHandler(async (req, res) => {
  const stats = await Quote.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        contacted: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
      }
    }
  ]);

  if (stats.length > 0) {
    const { total, pending, contacted, completed, cancelled } = stats[0];
    res.json({ total, pending, contacted, completed, cancelled });
  } else {
    res.json({ total: 0, pending: 0, contacted: 0, completed: 0, cancelled: 0 });
  }
});



/**
 * @desc    Récupérer tous les devis validés (version simple)
 * @route   GET /api/quote/validated/all
 * @access  Privé (admin)
 */
module.exports.getAllValidatedQuotesSimpleCtrl = asyncHandler(async (req, res) => {
  const quotes = await Quote.find({ status: 'validated' })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: quotes.length,
    quotes
  });
});











// controllers/quote.controller.js


exports.updateGoToFacturation = async (req, res) => {
  try {
    const { id } = req.params;
    const { goToFacturation } = req.body;

    const updatedQuote = await Quote.findByIdAndUpdate(
      id,
      { goToFacturation },
      { new: true }
    );

    if (!updatedQuote) {
      return res.status(404).json({ message: "Devis introuvable" });
    }

    res.status(200).json(updatedQuote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};