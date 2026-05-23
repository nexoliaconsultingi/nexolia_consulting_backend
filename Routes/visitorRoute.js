// routes/visitorRoute.js
const express = require("express");
const router = express.Router();
const { createSession, addPage, endSession, getVisitorSessions, deleteAllVisitor } = require("../Controllers/visitorController");

router.post("/sessions", createSession);           // Créer session
router.post("/sessions/page", addPage);           // Ajouter page
router.put("/sessions/end", endSession);        // Clôturer session
router.get("/visitors", getVisitorSessions);  // Récupérer toutes les visitors
router.delete("/visitors", deleteAllVisitor);  // Récupérer toutes les visitors

module.exports = router;