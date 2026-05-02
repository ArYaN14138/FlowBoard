import { Router } from "express";
import {
  createProject,
  createProjectSchema,
  deleteProject,
  listProjects,
  projectParamsSchema,
  updateProject,
  updateProjectSchema,
  uploadProjectAttachment
} from "../controllers/project.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listProjects);
router.post("/", requireRole("Admin", "Manager"), validate(createProjectSchema), createProject);
router.patch("/:id", requireRole("Admin", "Manager"), validate(updateProjectSchema), updateProject);
router.delete("/:id", requireRole("Admin"), validate(projectParamsSchema), deleteProject);
router.post("/:id/attachments", requireRole("Admin", "Manager"), validate(projectParamsSchema), upload.single("file"), uploadProjectAttachment);

export default router;
