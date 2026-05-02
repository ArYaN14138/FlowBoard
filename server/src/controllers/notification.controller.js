import { Notification } from "../models/Notification.js";

export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("task", "title status priority")
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
