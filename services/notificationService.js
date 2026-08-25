const { Notification } = require('../Models/notificationModel');
const { User } = require('../Models/userModel');
const { getSocket } = require('../socket');

// Crée une notification persistée pour un utilisateur + l'émet en temps réel
async function notifyUser(userId, { title, message, type = 'info', link = '' }) {
  try {
    const notif = await Notification.create({ targetUserId: userId, title, message, type, link });
    getSocket()?.emitToUser(String(userId), 'notification:new', notif);
    return notif;
  } catch (err) {
    console.error('notifyUser error:', err.message);
    return null;
  }
}

// Crée une notification pour chaque administrateur + émission en temps réel
async function notifyAdmins({ title, message, type = 'info', link = '' }) {
  try {
    const admins = await User.find({ access: 'admin' }).select('_id');
    const notifs = [];
    for (const admin of admins) {
      const notif = await Notification.create({
        targetUserId: admin._id,
        title,
        message,
        type,
        link,
      });
      getSocket()?.emitToUser(String(admin._id), 'notification:new', notif);
      notifs.push(notif);
    }
    return notifs;
  } catch (err) {
    console.error('notifyAdmins error:', err.message);
    return [];
  }
}

// Crée une notification pour chaque utilisateur ayant un rôle donné + émission en temps réel
async function notifyByRole(role, { title, message, type = 'info', link = '' }) {
  try {
    const targets = await User.find({ access: role }).select('_id');
    const notifs = [];
    for (const target of targets) {
      const notif = await Notification.create({
        targetUserId: target._id,
        title,
        message,
        type,
        link,
      });
      getSocket()?.emitToUser(String(target._id), 'notification:new', notif);
      notifs.push(notif);
    }
    return notifs;
  } catch (err) {
    console.error(`notifyByRole(${role}) error:`, err.message);
    return [];
  }
}

module.exports = { notifyUser, notifyAdmins, notifyByRole };
