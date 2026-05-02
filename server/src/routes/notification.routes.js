import { Router } from "express";
import { listNotifications, markNotificationsRead } from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listNotifications);
router.patch("/read", markNotificationsRead);

export default router;
