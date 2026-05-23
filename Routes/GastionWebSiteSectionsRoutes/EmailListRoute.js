const express = require('express');
const {
  registerEmailCtrl,
  getAllEmailsCtrl,
  deleteEmailCtrl
} = require('../../Controllers/GestionWebSiteSections/EmailListController');

const router = express.Router();

router.post('/register', registerEmailCtrl);
router.get('/all', getAllEmailsCtrl);
router.delete('/:id', deleteEmailCtrl);

module.exports = router;