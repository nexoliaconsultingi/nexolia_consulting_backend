const express = require('express');
const router = express.Router();
const {
    getAllOrdersCtrl,
    createOrderCtrl,
    updateOrderCtrl,
    deleteOrderCtrl
} = require("../Controllers/orderController");
const { protect, requireAccess } = require("../Middleware/authMiddleware");

// Route publique : le client passe commande depuis le store
router.post("/", createOrderCtrl);

// Routes réservées à Admin + Store (dashboard)
router.route("/")
    .get(protect, requireAccess("admin", "store"), getAllOrdersCtrl);

router.route("/:id")
    .put(protect, requireAccess("admin", "store"), updateOrderCtrl)
    .delete(protect, requireAccess("admin", "store"), deleteOrderCtrl);

module.exports = router;
