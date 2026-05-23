const asyncHandler = require('express-async-handler');
const { News, validateCreateNews, validateUpdateNews } = require('../Models/newsModel');

/* --------------------------------------------------
 * @desc    Create new news article
 * @route   /news/api
 * @method  POST
 * @access  private (authentifié)
 */
module.exports.createNewsCtrl = asyncHandler(async (req, res) => {
    // Validation des données
    const { error } = validateCreateNews(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    // Création
    const news = new News({
        title: req.body.title,
        category: req.body.category,
        date: req.body.date,
        endDateOfOffre: req.body.endDateOfOffre || null,
        excerpt: req.body.excerpt,
        content: req.body.content || '',
        image: req.body.image,
        isFeatured: req.body.isFeatured || false
    });

    await news.save();
    res.status(201).json({ message: 'Actualité créée avec succès', news });
});

/* --------------------------------------------------
 * @desc    Update news article
 * @route   /news/api/:id
 * @method  PUT
 * @access  private
 */
module.exports.updateNewsCtrl = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validation des données (champs optionnels)
    const { error } = validateUpdateNews(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const updatedNews = await News.findByIdAndUpdate(
        id,
        {
            $set: {
                title: req.body.title,
                category: req.body.category,
                date: req.body.date,
                endDateOfOffre: req.body.endDateOfOffre,
                excerpt: req.body.excerpt,
                content: req.body.content,
                image: req.body.image,
                isFeatured: req.body.isFeatured
            }
        },
        { new: true, runValidators: true }
    );

    if (!updatedNews) {
        return res.status(404).json({ message: 'Actualité non trouvée' });
    }

    res.status(200).json({ message: 'Actualité mise à jour', news: updatedNews });
});

/* --------------------------------------------------
 * @desc    Delete news article
 * @route   /news/api/:id
 * @method  DELETE
 * @access  private
 */
module.exports.deleteNewsCtrl = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedNews = await News.findByIdAndDelete(id);
    if (!deletedNews) {
        return res.status(404).json({ message: 'Actualité non trouvée' });
    }

    res.status(200).json({ message: 'Actualité supprimée avec succès' });
});

/* --------------------------------------------------
 * @desc    Get all news articles
 * @route   /news/api
 * @method  GET
 * @access  public
 */
module.exports.getAllNewsCtrl = asyncHandler(async (req, res) => {
    const { category, featured } = req.query;
    let query = {};

    // Filtrage par catégorie si spécifié
    if (category) {
        query.category = category;
    }

    // Filtrage par article à la une si spécifié
    if (featured === 'true') {
        query.isFeatured = true;
    }

    const news = await News.find(query).sort({ createdAt: -1 }); // du plus récent au plus ancien
    res.status(200).json(news);
});

/* --------------------------------------------------
 * @desc    Get one news article by ID
 * @route   /news/api/:id
 * @method  GET
 * @access  public
 */
module.exports.getOneNewsCtrl = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const news = await News.findById(id);
    if (!news) {
        return res.status(404).json({ message: 'Actualité non trouvée' });
    }

    res.status(200).json(news);
});

/* --------------------------------------------------
 * @desc    Get featured news article
 * @route   /news/api/featured
 * @method  GET
 * @access  public
 */
module.exports.getFeaturedNewsCtrl = asyncHandler(async (req, res) => {
    const featuredNews = await News.findOne({ isFeatured: true }).sort({ createdAt: -1 });
    
    if (!featuredNews) {
        // Si pas d'article à la une, retourner le plus récent
        const latestNews = await News.findOne().sort({ createdAt: -1 });
        return res.status(200).json(latestNews);
    }

    res.status(200).json(featuredNews);
});