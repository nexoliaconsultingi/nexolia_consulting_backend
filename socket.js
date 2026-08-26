const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('./Models/userModel');
require('dotenv').config();

const Token_Secret = process.env.Token_Secret;

// userId -> Set de socket ids (un utilisateur peut avoir plusieurs onglets)
const online = new Map();

// userId -> timer en attente de confirmation "hors ligne" (délai de grâce après un reload)
const offlineTimers = new Map();

// Délai de grâce : si l'utilisateur se reconnecte avant ce délai (reload de la page),
// aucune notification "hors ligne"/"en ligne" n'est émise
const OFFLINE_GRACE_MS = parseInt('15000', 10);

let helpers = null;

// Date/heure au format français, ex: 10/08/2026 à 14:35
function formatDateTime(d = new Date()) {
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date} à ${time}`;
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'https://nexolia-consulting.com', 'https://api.nexolia-consulting.com'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentification : le client envoie son JWT dans handshake.auth.token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      const decoded = jwt.verify(token, Token_Secret);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('unauthorized'));
      socket.user = {
        _id: String(user._id),
        name: user.name,
        access: Array.isArray(user.access) && user.access.length > 0 ? user.access : ['admin'],
      };
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id;
    const userName = socket.user.name;

    // Reconnection rapide (reload de la page) : on annule la mise hors ligne en attente
    const hadPendingOffline = offlineTimers.has(userId);
    if (hadPendingOffline) {
      clearTimeout(offlineTimers.get(userId));
      offlineTimers.delete(userId);
    }

    // Suivi des connexions
    const isFirstConnection = !online.has(userId);
    if (!online.has(userId)) online.set(userId, new Set());
    online.get(userId).add(socket.id);

    // Rooms : les admins reçoivent les statuts + mises à jour de la liste
    if (socket.user.access.includes('admin')) socket.join('admins');
    // Room Store : admins + utilisateurs avec accès store (temps réel fournisseurs, etc.)
    if (socket.user.access.includes('admin') || socket.user.access.includes('store')) {
      socket.join('store-managers');
    }
    socket.join(`user:${userId}`);

    // Prévenir les admins : cet utilisateur est en ligne
    io.to('admins').emit('users:status', {
      userId,
      isOnline: true,
      name: userName,
    });

    // Notification uniquement pour une vraie nouvelle connexion (pas un reload)
    if (isFirstConnection && !hadPendingOffline) {
      const { notifyAdmins } = require('./services/notificationService');
      notifyAdmins({
        title: 'Utilisateur en ligne',
        message: `${userName} est en ligne le ${formatDateTime()}`,
        type: 'success',
      });
    }

    socket.on('disconnect', () => {
      const set = online.get(userId);
      if (!set) return;
      set.delete(socket.id);
      if (set.size === 0) {
        online.delete(userId);

        // Diffère la notification "hors ligne" : si l'utilisateur se reconnecte
        // dans le délai de grâce (reload), rien n'est émis
        const timer = setTimeout(() => {
          offlineTimers.delete(userId);
          io.to('admins').emit('users:status', {
            userId,
            isOnline: false,
            name: userName,
          });

          const { notifyAdmins } = require('./services/notificationService');
          notifyAdmins({
            title: 'Utilisateur hors ligne',
            message: `${userName} est hors ligne le ${formatDateTime()}`,
            type: 'warning',
          });
        }, OFFLINE_GRACE_MS);
        offlineTimers.set(userId, timer);
      }
    });
  });

  helpers = {
    io,
    getOnlineUserIds: () => [...online.keys()],
    emitToUser: (userId, event, payload) => io.to(`user:${userId}`).emit(event, payload),
    emitToAdmins: (event, payload) => io.to('admins').emit(event, payload),
    emitToStore: (event, payload) => io.to('store-managers').emit(event, payload),
    disconnectUser: (userId) => io.to(`user:${userId}`).disconnectSockets(true),
  };

  return helpers;
}

function getSocket() {
  return helpers;
}

module.exports = { initSocket, getSocket };
