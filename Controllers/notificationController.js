const asyncHandler = require("express-async-handler");
const { Notification } = require("../Models/notificationModel");

/*--------------------------------------------------
* @desc    Get my notifications
* @router  /user/api/notifications
* @methode GET
* @access  Private
---------------------------------------------------*/
module.exports.getMyNotificationsCtrl = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ targetUserId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.status(200).json(notifications);
});

/*--------------------------------------------------
* @desc    Get unread notifications count
* @router  /user/api/notifications/unread-count
* @methode GET
* @access  Private
---------------------------------------------------*/
module.exports.getUnreadCountCtrl = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    targetUserId: req.user._id,
    read: false,
  });
  res.status(200).json({ count });
});

/*--------------------------------------------------
* @desc    Mark one notification as read
* @router  /user/api/notifications/:id/read
* @methode PUT
* @access  Private
---------------------------------------------------*/
module.exports.markReadCtrl = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, targetUserId: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notif) {
    return res.status(404).json({ message: "Notification not found" });
  }
  res.status(200).json(notif);
});

/*--------------------------------------------------
* @desc    Mark all notifications as read
* @router  /user/api/notifications/read-all
* @methode PUT
* @access  Private
---------------------------------------------------*/
module.exports.markAllReadCtrl = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { targetUserId: req.user._id, read: false },
    { read: true }
  );
  res.status(200).json({
    message: "All notifications marked as read",
    modifiedCount: result.modifiedCount,
  });
});

/*--------------------------------------------------
* @desc    Delete one notification
* @router  /user/api/notifications/:id
* @methode DELETE
* @access  Private
---------------------------------------------------*/
module.exports.deleteNotificationCtrl = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndDelete({
    _id: req.params.id,
    targetUserId: req.user._id,
  });
  if (!notif) {
    return res.status(404).json({ message: "Notification not found" });
  }
  res.status(200).json({ message: "Notification deleted", _id: notif._id });
});

/*--------------------------------------------------
* @desc    Delete all my notifications
* @router  /user/api/notifications
* @methode DELETE
* @access  Private
---------------------------------------------------*/
module.exports.deleteAllNotificationsCtrl = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ targetUserId: req.user._id });
  res.status(200).json({
    message: "All notifications deleted",
    deletedCount: result.deletedCount,
  });
});
