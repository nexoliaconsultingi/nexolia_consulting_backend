const express = require("express");
const { createInvoice, updateInvoice, deleteInvoice, getOneInvoice, getAllInvoices } = require("../Controllers/invoiceController");
const router = express.Router();

router.post("/",createInvoice);
router.put("/:id",updateInvoice);
router.delete("/:id",deleteInvoice);
router.get("/:id",getOneInvoice);
router.get("/", getAllInvoices);

module.exports = router;