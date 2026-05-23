const asyncHandler = require("express-async-handler");
const { Company, createCompanyValidation, updateCompanyValidation } = require("../Models/companyModel");


/*--------------------------------------------------
Create Company
POST /company/api
---------------------------------------------------*/
module.exports.createCompany = asyncHandler(async (req, res) => {

  const { error } = createCompanyValidation(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const company = new Company(req.body);

  await company.save();

  res.status(201).json({
    message: "Company created successfully",
    company
  });

});


/*--------------------------------------------------
Get All Companies
GET /company/api
---------------------------------------------------*/
module.exports.getAllCompanies = asyncHandler(async (req, res) => {

  const companies = await Company.find().sort({ createdAt: -1 });

  res.status(200).json(companies);

});


/*--------------------------------------------------
Get One Company
GET /company/api/:id
---------------------------------------------------*/
module.exports.getCompanyById = asyncHandler(async (req, res) => {

  const company = await Company.findById(req.params.id);

  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  res.status(200).json(company);

});


/*--------------------------------------------------
Update Company
PUT /company/api/:id
---------------------------------------------------*/



/*--------------------------------------------------
Update Company
PUT /company/api/:id
---------------------------------------------------*/
module.exports.updateCompany = asyncHandler(async (req, res) => {
  console.log("Données reçues pour mise à jour :", req.body);

  const { error } = updateCompanyValidation(req.body);
  if (error) {
    console.log("Erreur de validation Joi :", error.details);
    return res.status(400).json({
      message: "Données invalides",
      details: error.details.map(d => d.message)
    });
  }

  const company = await Company.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!company) {
    return res.status(404).json({ message: "Entreprise non trouvée" });
  }

  res.status(200).json({
    message: "Entreprise mise à jour avec succès",
    company
  });
});


/*--------------------------------------------------
Delete Company
DELETE /company/api/:id
---------------------------------------------------*/
// module.exports.deleteCompany = asyncHandler(async (req, res) => {

//   const company = await Company.findByIdAndDelete(req.params.id);

//   if (!company) {
//     return res.status(404).json({ message: "Company not found" });
//   }

//   res.status(200).json({
//     message: "Company deleted successfully"
//   });

// });