const express = require("express");

const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
//   deleteCompany,
  
} = require("../Controllers/companyController");

const router = express.Router();

router.route("/")
.post(createCompany)
.get(getAllCompanies);

router.route("/:id")
.get(getCompanyById)
.put(updateCompany)
// .delete(deleteCompany);

module.exports = router;