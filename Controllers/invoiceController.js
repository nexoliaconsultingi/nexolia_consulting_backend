const Invoice = require("../Models/Invoice");
const Counter = require("../Models/Counter");

/*----------------------------------
🔢 Générer numéro facture
-----------------------------------*/
const getNextInvoiceNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "invoice" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

/*----------------------------------
🧮 Calcul des totaux
-----------------------------------*/
const calculateTotals = (items) => {
  let totalHT = 0;

  items.forEach(item => {
    item.montantHT = item.quantite * item.prixHT;
    totalHT += item.montantHT;
  });

  const tva = totalHT * 0.19;
  const totalTTC = totalHT + tva;

  return { totalHT, tva, totalTTC };
};

/*----------------------------------
➕ CREATE
-----------------------------------*/
exports.createInvoice = async (req, res) => {
  try {
    const invoiceNumber = await getNextInvoiceNumber();

    const { totalHT, tva, totalTTC } = calculateTotals(req.body.items);

    const invoice = new Invoice({
      ...req.body,
      invoiceNumber,
      totalHT,
      tva,
      totalTTC
    });

    await invoice.save();

    res.status(201).json({
      message: "Facture créée avec succès",
      invoice
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*----------------------------------
✏️ UPDATE
-----------------------------------*/
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // recalcul si items changés
    let updateData = { ...req.body };

    if (req.body.items) {
      const { totalHT, tva, totalTTC } = calculateTotals(req.body.items);
      updateData.totalHT = totalHT;
      updateData.tva = tva;
      updateData.totalTTC = totalTTC;
    }

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }

    res.status(200).json({
      message: "Facture mise à jour",
      invoice
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*----------------------------------
❌ DELETE
-----------------------------------*/
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByIdAndDelete(id);

    if (!invoice) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }

    res.status(200).json({
      message: "Facture supprimée avec succès"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*----------------------------------
🔍 VIEW ONE
-----------------------------------*/
exports.getOneInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }

    res.status(200).json(invoice);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*----------------------------------
📄 VIEW ALL
-----------------------------------*/
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 }); // les plus récents en premier

    res.status(200).json(invoices);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};