const express = require('express');
const {
  registerFaqCtrl,
  readAllFaqsCtrl,
  readOneFaqCtrl,
  updateFaqCtrl,
  deleteFaqCtrl,
  createManyFQA,
} = require('../../Controllers/GestionWebSiteSections/FAQController');

const router = express.Router();

router.post('/register', registerFaqCtrl);
router.post('/registerMany', createManyFQA);
router.get('/all', readAllFaqsCtrl);
router.get('/:id', readOneFaqCtrl);
router.put('/:id', updateFaqCtrl);
router.delete('/:id', deleteFaqCtrl);
createManyFQA
module.exports = router;