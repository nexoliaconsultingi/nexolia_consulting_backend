const asyncHandler = require("express-async-handler");
const { User, registerVerify, loginVerify } = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config()
const nodemailer = require("nodemailer");

const crypto = require("crypto");
const Token_Secret = process.env.Token_Secret





const verificationCodes = new Map(); // clé = email, valeur = { code, expiresAt }

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ,
  port: process.env.SMTP_PORT ,
  secure: true,
  auth: {
    user:process.env.SMTP_USER , // ton email
    pass:process.env.SMTP_PASS , // ton mot de passe d'application Gmail
  },
});









/*--------------------------------------------------
* @desc    Register new User
* @router  /api/auth/register
* @methode POST
* @access  Privat
----------------------------------------------------*/
module.exports.registerCtel = asyncHandler(async (req, res) => {
  // Validation
  const { error } = registerVerify(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }



  // Is user already exists
  const findUser = await User.findOne({ email: req.body.email });
  if (findUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);


  // New user and save it in DB
  const newUser = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });
  await newUser.save();


  // Send a response to client
  res.status(201).json({ message: 'You registered successfully, please log in' });
});





/*--------------------------------------------------
* @desc    Login new User
* @router  /api/auth/login
* @methode POST
* @access  privat
----------------------------------------------------*/
// module.exports.loginCtrl = asyncHandler(async (req, res) => {
//   // Validation
//   const { error } = loginVerify(req.body);
//   if (error) {
//     return res.status(400).json({ message: error.details[0].message });
//   }

//   // Find user by email
//   const findEmailUser = await User.findOne({ email: req.body.email });
//   if (!findEmailUser) {
//     return res.status(400).json({ message: 'Email or password is invalid' });
//   }

//   // Password compare
//   const passwordCompare = await bcrypt.compare(req.body.password, findEmailUser.password);
//   if (!passwordCompare) {
//     return res.status(400).json({ message: 'Email or password is invalid' });
//   }

//   // Genaration of the Token
//   const token = jwt.sign(
//     { id: findEmailUser._id,name: findEmailUser.name},
//     Token_Secret,
//     { expiresIn: '8h' }
//   );


//   res.status(200).json({
//     _id: findEmailUser._id,
//     name: findEmailUser.name,
//     token
//   });
  
// });










/*--------------------------------------------------
* @desc    Login new User
* @router  /api/auth/login
* @methode POST
* @access  privat
----------------------------------------------------*/

module.exports.loginCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Vérification basique des champs
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Vérifier si l'utilisateur existe
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Email or password is invalid" });
  }

  // Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Email or password is invalid" });
  }

  // Générer un code de 6 chiffres
  const code = crypto.randomInt(100000, 999999).toString();

  // Stocker le code avec date d'expiration (3 minutes)
  verificationCodes.set(email, {
    code,
    expiresAt: Date.now() + 3 * 60 * 1000, // 3 minutes
  });

  // Envoyer le code par email
  try {
    await transporter.sendMail({
      from: '"Nexolia" <wahbisj@gmail.com>',
      to: email,
      subject: "Votre code de vérification",
      text: `Bonjour ${user.name}, votre code de vérification est : ${code}`,
      html: `<p>Bonjour <b>${user.name}</b>,</p><p>Votre code de vérification est : <b>${code}</b></p>`,
    });

    return res.status(200).json({
      message: "Email and password verified. Verification code sent to your email.",
      isEmailPasswordRecaptchaVerified : true
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to send verification code" });
  }
});










/*--------------------------------------------------
* @desc    Login new User
* @router  /api/auth/verify-code
* @methode POST
* @access  privat
----------------------------------------------------*/

// Contrôleur pour vérifier le code envoyé par l'utilisateur
module.exports.verifyCodeCtrl = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required" });
  }

  const savedCode = verificationCodes.get(email);

  if (!savedCode) {
    return res.status(400).json({ message: "No verification code found for this email" });
  }

  if (Date.now() > savedCode.expiresAt) {
    verificationCodes.delete(email);
    return res.status(400).json({ message: "Verification code expired" });
  }

  if (savedCode.code !== code) {
    return res.status(400).json({ message: "Invalid verification code" });
  }

  // Code correct → générer le token JWT
  const user = await User.findOne({ email });
  const token = jwt.sign(
    { id: user._id, name: user.name },
    Token_Secret,
    { expiresIn: "8h" }
  );

  // Supprimer le code après vérification
  verificationCodes.delete(email);

  res.status(200).json({
    message: "Login successful",
    _id: user._id,
    name: user.name,
    token,
  });
});





















