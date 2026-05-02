import { Activity } from "../models/Activity.js";
import { Notification } from "../models/Notification.js";
import { emitUserEvent, emitWorkspaceEvent } from "./realtime.service.js";

export const recordActivity = async (req, payload) => {
  const activity = await Activity.create({
    actor: req.user._id,
    ...payload
  });
  const populated = await activity.populate("actor", "name email role");
  emitWorkspaceEvent(req, "activity:created", populated);
  return populated;
};

export const notifyUser = async (req, payload) => {
  if (!payload.recipient) return null;

  const notification = await Notification.create(payload);
  emitUserEvent(req, payload.recipient.toString(), "notification:created", notification);
  return notification;
};
