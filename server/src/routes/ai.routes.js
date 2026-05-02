import { Router } from "express";
import { chat, chatSchema, generateDescription, generateDescriptionSchema, generateTask, generateTaskSchema, getInsights } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use(requireAuth);
router.post("/generate-task", validate(generateTaskSchema), generateTask);
router.post("/generate-description", validate(generateDescriptionSchema), generateDescription);
router.get("/insights", getInsights);
router.post("/chat", validate(chatSchema), chat);

export default router;
