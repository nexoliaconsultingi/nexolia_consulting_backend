const express = require('express');
const {
  registerCtel,
  loginCtrl,
  verifyCodeCtrl,
  getMeCtrl,
  getAllUsersCtrl,
  createUserCtrl,
  updateUserCtrl,
  deleteUserCtrl,
  heartbeatCtrl,
  logoutCtrl,
} = require('../Controllers/authController');
// const {
//   getMyNotificationsCtrl,
//   getUnreadCountCtrl,
//   markReadCtrl,
//   markAllReadCtrl,
//   deleteNotificationCtrl,
//   deleteAllNotificationsCtrl,
// } = require('../Controllers/notificationController');
// const { protect, requireAccess } = require('../Middleware/authMiddleware');
const router = express.Router();

// register route :
router.route('/register').post(registerCtel);

//Login route :
router.route('/login').post(loginCtrl)

//Verification MFA Code mail
router.route('/verify-code').post(verifyCodeCtrl)

// // Current user profile (protected)
// router.route('/me').get(protect, getMeCtrl)

// // Heartbeat : signale que l'utilisateur est actif
// router.route('/heartbeat').post(protect, heartbeatCtrl)

// // Logout : marque l'utilisateur hors ligne
// router.route('/logout').post(protect, logoutCtrl)

// // User management (admin only)
// router.route('/users')
//   .get(protect, requireAccess('admin'), getAllUsersCtrl)
//   .post(protect, requireAccess('admin'), createUserCtrl)
// router.route('/users/:id')
//   .put(protect, requireAccess('admin'), updateUserCtrl)
//   .delete(protect, requireAccess('admin'), deleteUserCtrl)

// // Notifications (protected)
// router.route('/notifications')
//   .get(protect, getMyNotificationsCtrl)
//   .delete(protect, deleteAllNotificationsCtrl)
// router.route('/notifications/unread-count').get(protect, getUnreadCountCtrl)
// router.route('/notifications/read-all').put(protect, markAllReadCtrl)
// router.route('/notifications/:id/read').put(protect, markReadCtrl)
// router.route('/notifications/:id').delete(protect, deleteNotificationCtrl)

// // Example of a role-protected route (ERP only)
// router.route('/erp-only').get(protect, requireAccess('erp'), (req, res) => {
//   res.status(200).json({ message: 'ERP access granted', user: req.user.name, access: req.user.access });
// });

module.exports = router;
