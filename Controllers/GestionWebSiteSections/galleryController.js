const asyncHandler = require('express-async-handler');
const { Gallery, validateCreateGallery, validateUpdateGallery } = require('../../Models/GestionWebSiteSections/galleryModel');

/* --------------------------------------------------
 * @desc    Create new gallery image
 * @route   /gallery/api
 * @method  POST
 * @access  private (authentifié)
 */
module.exports.createGalleryCtrl = asyncHandler(async (req, res) => {
    // Validation des données
    const { error } = validateCreateGallery(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    // Création
    const gallery = new Gallery({
        src: req.body.src,
        alt: req.body.alt,
        category: req.body.category,
        location: req.body.location,
        date: req.body.date
    });

    await gallery.save();
    res.status(201).json({ message: 'Image ajoutée à la galerie avec succès', gallery });
});

/* --------------------------------------------------
 * @desc    Update gallery image
 * @route   /gallery/api/:id
 * @method  PUT
 * @access  private
 */
module.exports.updateGalleryCtrl = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validation des données (champs optionnels)
    const { error } = validateUpdateGallery(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const updatedGallery = await Gallery.findByIdAndUpdate(
        id,
        {
            $set: {
                src: req.body.src,
                alt: req.body.alt,
                category: req.body.category,
                location: req.body.location,
                date: req.body.date
            }
        },
        { new: true, runValidators: true }
    );

    if (!updatedGallery) {
        return res.status(404).json({ message: 'Image non trouvée' });
    }

    res.status(200).json({ message: 'Image mise à jour', gallery: updatedGallery });
});

/* --------------------------------------------------
 * @desc    Delete gallery image
 * @route   /gallery/api/:id
 * @method  DELETE
 * @access  private
 */
module.exports.deleteGalleryCtrl = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedGallery = await Gallery.findByIdAndDelete(id);
    if (!deletedGallery) {
        return res.status(404).json({ message: 'Image non trouvée' });
    }

    res.status(200).json({ message: 'Image supprimée avec succès' });
});

/* --------------------------------------------------
 * @desc    Get all gallery images
 * @route   /gallery/api
 * @method  GET
 * @access  public
 */
module.exports.getAllGalleriesCtrl = asyncHandler(async (req, res) => {
    const galleries = await Gallery.find().sort({ createdAt: -1 }); // du plus récent au plus ancien
    res.status(200).json(galleries);
});

/* --------------------------------------------------
 * @desc    Get one gallery image by ID
 * @route   /gallery/api/:id
 * @method  GET
 * @access  public
 */
module.exports.getOneGalleryCtrl = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const gallery = await Gallery.findById(id);
    if (!gallery) {
        return res.status(404).json({ message: 'Image non trouvée' });
    }

    res.status(200).json(gallery);
});