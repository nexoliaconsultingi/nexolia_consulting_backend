const asyncHandler = require("express-async-handler");
const { User, registerVerify, loginVerify, updateUserVerify } = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config()
const nodemailer = require("nodemailer");

const crypto = require("crypto");
const Token_Secret = process.env.Token_Secret
const { getSocket } = require("../socket");
const { notifyUser, notifyAdmins } = require("../Services/notificationService");





const verificationCodes = new Map(); // clé = email, valeur = { code, expiresAt }

// Fallback : un utilisateur sans access (ancien compte) est considéré admin
const getEffectiveAccess = (user) =>
  Array.isArray(user.access) && user.access.length > 0 ? user.access : ['admin'];

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
  return createUser(req, res);
});

// Logique partagée de création d'utilisateur (register public + création admin)
async function createUser(req, res) {
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
    access: req.body.access || ['admin'],
  });
  await newUser.save();

  // Prévenir les admins : nouvelle liste à rafraîchir
  getSocket()?.emitToAdmins('users:updated', { action: 'create' });

  // Notification aux admins : un utilisateur vient d'être ajouté
  notifyAdmins({
    title: 'Nouvel utilisateur ajouté',
    message: `${newUser.name} (${newUser.email}) a été ajouté à la plateforme`,
    type: 'success',
    link: '/dashboard/admin/users',
  });

  // Send a response to client
  res.status(201).json({
    message: 'You registered successfully, please log in',
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    access: newUser.access,
  });
}

/*--------------------------------------------------
* @desc    Create a new user (admin)
* @router  /user/api/users
* @methode POST
* @access  Private (Admin)
----------------------------------------------------*/
module.exports.createUserCtrl = asyncHandler(async (req, res) => {
  return createUser(req, res);
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
  const access = getEffectiveAccess(user);

  // Enregistrer la connexion
  user.lastLoginAt = new Date();
  user.lastSeenAt = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id, name: user.name, access },
    Token_Secret,
    { expiresIn: "8h" }
  );

  // Supprimer le code après vérification
  verificationCodes.delete(email);

  res.status(200).json({
    message: "Login successful",
    _id: user._id,
    name: user.name,
    email: user.email,
    access,
    token,
  });
});

/*--------------------------------------------------
* @desc    Get current logged-in user profile
* @router  /user/api/me
* @methode GET
* @access  Private
----------------------------------------------------*/
module.exports.getMeCtrl = asyncHandler(async (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    access: getEffectiveAccess(req.user),
  });
});

/*--------------------------------------------------
* @desc    Heartbeat : signaler que l'utilisateur est actif
* @router  /user/api/heartbeat
* @methode POST
* @access  Private
----------------------------------------------------*/
module.exports.heartbeatCtrl = asyncHandler(async (req, res) => {
  req.user.lastSeenAt = new Date();
  await req.user.save();
  res.status(200).json({ message: "ok", lastSeenAt: req.user.lastSeenAt });
});

/*--------------------------------------------------
* @desc    Logout : marquer l'utilisateur hors ligne
* @router  /user/api/logout
* @methode POST
* @access  Private
----------------------------------------------------*/
module.exports.logoutCtrl = asyncHandler(async (req, res) => {
  req.user.lastSeenAt = null;
  await req.user.save();

  // Fermer les sockets de l'utilisateur (déclenche le broadcast hors-ligne)
  getSocket()?.disconnectUser(String(req.user._id));

  res.status(200).json({ message: "Logged out successfully" });
});

/*--------------------------------------------------
* @desc    Get all users
* @router  /user/api/users
* @methode GET
* @access  Private (Admin)
----------------------------------------------------*/
module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  const ONLINE_THRESHOLD = 3 * 60 * 1000; // 3 minutes (fallback sans socket)
  const onlineIds = new Set(getSocket()?.getOnlineUserIds() || []);
  const cleaned = users.map((u) => {
    const obj = u.toObject();
    const lastSeen = obj.lastSeenAt ? new Date(obj.lastSeenAt).getTime() : 0;
    return {
      ...obj,
      access: getEffectiveAccess(u),
      isOnline: onlineIds.has(String(u._id)) || (lastSeen > 0 && Date.now() - lastSeen < ONLINE_THRESHOLD),
    };
  });
  res.status(200).json(cleaned);
});

/*--------------------------------------------------
* @desc    Update one user
* @router  /user/api/users/:id
* @methode PUT
* @access  Private (Admin)
----------------------------------------------------*/
module.exports.updateUserCtrl = asyncHandler(async (req, res) => {
  const { error } = updateUserVerify(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.email !== undefined) updateData.email = req.body.email;

  // Empêcher de retirer le dernier admin
  if (req.body.access !== undefined) {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    const hadAdmin = getEffectiveAccess(target).includes('admin');
    const willHaveAdmin = req.body.access.includes('admin');
    if (hadAdmin && !willHaveAdmin) {
      const adminCount = await User.countDocuments({ access: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot remove the last admin" });
      }
    }
    updateData.access = req.body.access;
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(req.body.password, salt);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Temps réel : notifier l'utilisateur concerné de son nouveau rôle
  getSocket()?.emitToUser(String(user._id), 'access:updated', {
    user: { _id: user._id, name: user.name, email: user.email, access: user.access },
  });

  // Temps réel : prévenir les admins que la liste a changé
  getSocket()?.emitToAdmins('users:updated', { action: 'update', user: { _id: user._id, access: user.access } });

  // Notification à l'utilisateur concerné
  notifyUser(String(user._id), {
    title: 'Accès mis à jour',
    message: `Vos accès sont désormais : ${getEffectiveAccess(user).join(', ')}`,
    type: 'info',
  });

  // Notification aux admins
  notifyAdmins({
    title: 'Utilisateur modifié',
    message: `${user.name} (${user.email}) a vu son profil mis à jour`,
    type: 'info',
    link: '/dashboard/admin/users',
  });

  res.status(200).json({ message: "User updated successfully", user });
});

/*--------------------------------------------------
* @desc    Delete one user
* @router  /user/api/users/:id
* @methode DELETE
* @access  Private (Admin)
----------------------------------------------------*/
module.exports.deleteUserCtrl = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }

  // Empêcher de se supprimer soi-même
  if (String(target._id) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  // Empêcher de supprimer le dernier admin
  if (getEffectiveAccess(target).includes('admin')) {
    const adminCount = await User.countDocuments({ access: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ message: "Cannot delete the last admin" });
    }
  }

  await User.findByIdAndDelete(req.params.id);

  // Temps réel : prévenir les admins que la liste a changé
  getSocket()?.emitToAdmins('users:updated', { action: 'delete', user: { _id: target._id } });

  // Déconnecter les sockets de l'utilisateur supprimé
  getSocket()?.disconnectUser(String(target._id));

  // Notification aux admins
  notifyAdmins({
    title: 'Utilisateur supprimé',
    message: `${target.name} (${target.email}) a été supprimé de la plateforme`,
    type: 'warning',
    link: '/dashboard/admin/users',
  });

  res.status(200).json({ message: "User deleted successfully" });
});





















