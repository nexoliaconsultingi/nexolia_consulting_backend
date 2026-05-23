// Controllers/GestionWebSiteSections/ReviewController.js
const asyncHandler = require("express-async-handler");
const { Review } = require("../../Models/GestionWebSiteSections/Review");
const Joi = require('joi');

// Validation pour la création
const registerValidate = (data) => {
  const schema = Joi.object({
    userName: Joi.string().required(),
    email: Joi.string().email().required(),
    profileImage: Joi.string().uri().allow(''), // permet chaîne vide
    service: Joi.string().required(),
    reviewText: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    city: Joi.string().required(),
    isValidated: Joi.boolean().optional(), // on peut le mettre mais on le gère par défaut
  });
  return schema.validate(data);
};

// Validation pour la mise à jour (champs optionnels)
const updateValidate = (data) => {
  const schema = Joi.object({
    userName: Joi.string(),
    email: Joi.string().email(),
    profileImage: Joi.string().uri().allow(''),
    service: Joi.string(),
    reviewText: Joi.string(),
    rating: Joi.number().integer().min(1).max(5),
    city: Joi.string(),
    isValidated: Joi.boolean(),
  }).min(1);
  return schema.validate(data);
};

/* --------------------------------------------------
 * @desc    Créer un avis (non validé par défaut)
 * @route   POST /api/review/register
 * @access  Public
 * -------------------------------------------------- */
module.exports.registerReviewCtrl = asyncHandler(async (req, res) => {
  const { error } = registerValidate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // On force isValidated à false même si envoyé
  req.body.isValidated = false;

  const IsReviewExist = await Review.findOne({email:req.body.email})
  
  if(IsReviewExist){
    return res.status(400).json({message:"You have alrady review !"})
  }

  const newReview = new Review(req.body);
  await newReview.save();

  res.status(201).json({ message: "Avis envoyé, en attente de validation", review: newReview });
});

/* --------------------------------------------------
 * @desc    Mettre à jour un avis (admin seulement)
 * @route   PUT /api/review/:id
 * @access  Privé (admin)
 * -------------------------------------------------- */
module.exports.updateReviewCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = updateValidate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: "Avis non trouvé" });
  }

  const updatedReview = await Review.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json({ message: "Avis mis à jour", review: updatedReview });
});

/* --------------------------------------------------
 * @desc    Supprimer un avis
 * @route   DELETE /api/review/:id
 * @access  Privé (admin)
 * -------------------------------------------------- */
module.exports.deleteReviewCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: "Avis non trouvé" });
  }

  await Review.findByIdAndDelete(id);

  res.status(200).json({ message: "Avis supprimé avec succès" });
});

/* --------------------------------------------------
 * @desc    Récupérer un avis par ID
 * @route   GET /api/review/:id
 * @access  Privé (admin)
 * -------------------------------------------------- */
module.exports.readOneReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: "Avis non trouvé" });
  }

  res.status(200).json(review);
});

/* --------------------------------------------------
 * @desc    Récupérer tous les avis (admin)
 * @route   GET /api/review/all
 * @access  Privé (admin)
 * -------------------------------------------------- */
module.exports.readAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 });
  res.status(200).json(reviews);
});

/* --------------------------------------------------
 * @desc    Récupérer uniquement les avis validés (public)
 * @route   GET /api/review/validated
 * @access  Public
 * -------------------------------------------------- */
module.exports.readValidatedReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ isValidated: true }).sort({ createdAt: -1 });
  res.status(200).json(reviews);
});