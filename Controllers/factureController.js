const asyncHandler = require('express-async-handler');
const Facture = require('../Models/facture');
const Quote = require('../Models/Quote');
const Joi = require('joi');

/**
 * @desc    Créer une facture à partir d'un devis existant
 * @route   POST /api/facture/:id (où id = id du devis)
 * @access  Public
 */
module.exports.createFactureCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Vérifier si l'id est fourni
  if (!id) {
    return res.status(400).json({ message: 'ID du devis requis' });
  }

  // Récupérer le devis par ID
  const devisById = await Quote.findById(id);
  if (!devisById) {
    return res.status(404).json({ message: 'Devis non trouvé' });
  }

  // Créer la facture à partir des données du devis
  const initiationFacture = await Facture.create({
    firstName: devisById.firstName,
    lastName: devisById.lastName,
    email: devisById.email,
    phone: devisById.phone,
    addressClient: devisById.addressClient,
    matriculeFiscaleClient: devisById.matriculeFiscaleClient,
    moveType: devisById.moveType,
    pickupAddress: devisById.pickupAddress,
    pickupFloors: devisById.pickupFloors,
    pickupElevator: devisById.pickupElevator,
    deliveryAddress: devisById.deliveryAddress,
    deliveryFloors: devisById.deliveryFloors,
    deliveryElevator: devisById.deliveryElevator,
    priceHT: devisById.priceHT,
    tvaRate: devisById.tvaRate,
    priceTTC: devisById.priceTTC,
    dateFacture: Date.now()
  });


  await Quote.findByIdAndUpdate(id, {
  isFactured: true
});

  res.status(201).json({
    message: "Facture créée avec succès",
    facture: initiationFacture
  });
});

/**
 * @desc    Mettre à jour une facture par ID
 * @route   PUT /api/facture/:id
 * @access  Privé (admin)
 */
module.exports.updateFactureCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const value = req.body;

  const existingFacture = await Facture.findById(id);

  if (!existingFacture) {
    return res.status(404).json({ message: 'Facture non trouvée' });
  }

  // 🔥 Gestion date échéance
  const dateFacture = value.dateFacture || existingFacture.dateFacture;

  const NombreJourePayement =
    value.NombreJourePayement != null
      ? value.NombreJourePayement
      : existingFacture.NombreJourePayement;

  if (dateFacture && NombreJourePayement != null) {
    const date = new Date(dateFacture);
    date.setDate(date.getDate() + NombreJourePayement);
    value.dateEcheancie = date;
  }

  // 🔥 ✅ LOGIQUE TIMBRE
  if (value.timbre != null) {
    const oldPriceTTC = existingFacture.priceTTC || 0;
    value.priceTTC = oldPriceTTC + value.timbre;
  }

  const updatedFacture = await Facture.findByIdAndUpdate(
    id,
    value,
    { new: true, runValidators: true }
  );

  res.json({
    message: 'Facture mise à jour avec succès',
    facture: updatedFacture
  });
});

/**
 * @desc    Supprimer une facture
 * @route   DELETE /api/facture/:id
 * @access  Privé (admin)
 */
module.exports.deleteFactureCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const facture = await Facture.findByIdAndDelete(id);
  if (!facture) {
    return res.status(404).json({ message: 'Facture non trouvée' });
  }

  res.json({ message: 'Facture supprimée avec succès' });
});

/**
 * @desc    Récupérer toutes les factures
 * @route   GET /api/facture/
 * @access  Privé (admin)
 */
module.exports.getAllFactureCtrl = asyncHandler(async (req, res) => {
  const factures = await Facture.find();
  res.json(factures); // Retourne un tableau (vide si aucune facture)
});