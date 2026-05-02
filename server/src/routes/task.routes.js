import { Router } from "express";
import {
  createTask,
  createTaskSchema,
  deleteTask,
  addComment,
  commentSchema,
  listTasks,
  listComments,
  taskParamsSchema,
  taskQuerySchema,
  updateTask,
  updateTaskSchema,
  uploadAttachment
} from "../controllers/task.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", validate(taskQuerySchema), listTasks);
router.post("/", requireRole("Admin", "Manager"), validate(createTaskSchema), createTask);
router.patch("/:id", validate(updateTaskSchema), updateTask);
router.delete("/:id", requireRole("Admin"), validate(taskParamsSchema), deleteTask);
router.get("/:id/comments", validate(taskParamsSchema), listComments);
router.post("/:id/comments", validate(commentSchema), addComment);
router.post("/:id/attachments", validate(taskParamsSchema), upload.single("file"), uploadAttachment);

export default router;
