const express = require('express');
const { registerCtel, loginCtrl, verifyCodeCtrl } = require('../Controllers/authController');
const router = express.Router();

// register route :
router.route('/register').post(registerCtel);

//Login route :
router.route('/login').post(loginCtrl)


//Verification MFA Code mail
router.route('/verify-code').post(verifyCodeCtrl)






module.exports = router;