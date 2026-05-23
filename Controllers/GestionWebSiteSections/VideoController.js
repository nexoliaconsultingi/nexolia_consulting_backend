const asyncHandler = require("express-async-handler");
const { Video } = require("../../Models/GestionWebSiteSections/Video");
const Joi = require('joi');

// Validation pour la création
const registerValidate = (data) => {
  const schema = Joi.object({
    title: Joi.string().required().messages({
      'string.empty': 'Le titre est requis',
    }),
    description: Joi.string().required(),
    youtubeLink: Joi.string().uri().required().messages({
      'string.uri': 'Le lien YouTube doit être une URL valide',
    }),
  });
  return schema.validate(data);
};

// Validation pour la mise à jour (tous les champs optionnels)
const updateValidate = (data) => {
  const schema = Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    youtubeLink: Joi.string().uri(),
  }).min(1);
  return schema.validate(data);
};

/* --------------------------------------------------
 * @desc    Créer une nouvelle vidéo
 * @route   POST /api/video/register
 * @access  Privé
 * -------------------------------------------------- */
module.exports.registerVideoCtrl = asyncHandler(async (req, res) => {
  const { error } = registerValidate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Vérifier si une vidéo avec le même titre existe déjà (optionnel)
  const existingVideo = await Video.findOne({ title: req.body.title });
  if (existingVideo) {
    return res.status(400).json({ message: "Une vidéo avec ce titre existe déjà" });
  }

  const newVideo = new Video(req.body);
  await newVideo.save();

  res.status(201).json({
    message: "Vidéo créée avec succès",
    video: newVideo,
  });
});

/* --------------------------------------------------
 * @desc    Mettre à jour une vidéo
 * @route   PUT /api/video/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.updateVideoCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validation
  const { error } = updateValidate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).json({ message: "Vidéo non trouvée" });
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    id,          // directement l'ID
    req.body,    // pas besoin de $set
    { new: true, runValidators: true }
  );

  res.status(200).json({
    message: "Vidéo mise à jour avec succès",
    video: updatedVideo,
  });
});

/* --------------------------------------------------
 * @desc    Supprimer une vidéo
 * @route   DELETE /api/video/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.deleteVideoCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).json({ message: "Vidéo non trouvée" });
  }

  await Video.findByIdAndDelete(id);

  res.status(200).json({ message: "Vidéo supprimée avec succès" });
});

/* --------------------------------------------------
 * @desc    Récupérer une vidéo par ID
 * @route   GET /api/video/:id
 * @access  Privé
 * -------------------------------------------------- */
module.exports.readOneVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).json({ message: "Vidéo non trouvée" });
  }

  res.status(200).json(video);
});

/* --------------------------------------------------
 * @desc    Récupérer toutes les vidéos
 * @route   GET /api/video/all
 * @access  Privé
 * -------------------------------------------------- */
module.exports.readAllVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find().sort({ createdAt: -1 });
  res.status(200).json(videos);
});





