const express = require('express');
const router = express.Router();
const {
    getAllNewsletterClientsCtrl,
    createNewsletterClientCtrl,
    updateNewsletterClientCtrl,
    deleteNewsletterClientCtrl,
    subscribeNewsletterClientCtrl,
    getNewsletterCountCtrl,
    sendNewsletterEmailCtrl,
    getEmailHistoryCtrl,
    getEmailHistoryDetailCtrl,
    deleteEmailHistoryCtrl
} = require("../Controllers/newsletterController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Routes publiques : utilisées par le formulaire d'inscription du site store
router.post("/subscribe", subscribeNewsletterClientCtrl);
router.get("/count", getNewsletterCountCtrl);

// Toutes les routes : réservées à Admin + Store
router.route("/client")
    .get(protect, requireAccess("admin", "store"), getAllNewsletterClientsCtrl)
    .post(protect, requireAccess("admin", "store"), createNewsletterClientCtrl);

router.route("/client/:id")
    .put(protect, requireAccess("admin", "store"), updateNewsletterClientCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteNewsletterClientCtrl);

router.route("/send")
    .post(protect, requireAccess("admin", "store"), sendNewsletterEmailCtrl);

router.route("/history")
    .get(protect, requireAccess("admin", "store"), getEmailHistoryCtrl);

router.route("/history/:id")
    .get(protect, requireAccess("admin", "store"), getEmailHistoryDetailCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteEmailHistoryCtrl);

module.exports = router;
