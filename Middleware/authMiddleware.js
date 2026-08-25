const jwt = require("jsonwebtoken");
const { User } = require("../Models/userModel");
require("dotenv").config();

const Token_Secret = process.env.Token_Secret;

// Middleware de protection : vérifie que le token JWT est valide et charge l'utilisateur
module.exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, Token_Secret);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// Middleware de vérification d'accès : l'utilisateur doit avoir au moins un des rôles passés
module.exports.requireAccess = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Fallback : un utilisateur sans access (ancien compte) est considéré admin
    const rawAccess = req.user.access;
    const userAccess = Array.isArray(rawAccess) && rawAccess.length > 0 ? rawAccess : ['admin'];

    const hasAccess = userAccess.includes("admin") || roles.some((role) => userAccess.includes(role));

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }

    next();
  };
};
