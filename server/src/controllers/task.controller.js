import mongoose from "mongoose";
import { z } from "zod";
import { Comment } from "../models/Comment.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { notifyUser, recordActivity } from "../services/activity.service.js";
import { emitWorkspaceEvent } from "../services/realtime.service.js";
import { ApiError } from "../utils/ApiError.js";

const objectId = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid id");
const status = z.enum(["Todo", "In Progress", "Done"]);
const priority = z.enum(["Low", "Medium", "High"]);

const canManageWork = (user) => ["Admin", "Manager"].includes(user.role);

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(160),
    description: z.string().max(2000).optional().default(""),
    deadline: z.coerce.date(),
    project: objectId,
    assignedTo: objectId,
    status: status.optional().default("Todo"),
    priority: priority.optional().default("Medium")
  })
});

export const updateTaskSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    title: z.string().min(2).max(160).optional(),
    description: z.string().max(2000).optional(),
    deadline: z.coerce.date().optional(),
    project: objectId.optional(),
    assignedTo: objectId.optional(),
    status: status.optional(),
    priority: priority.optional()
  })
});

export const taskParamsSchema = z.object({
  params: z.object({ id: objectId })
});

export const taskQuerySchema = z.object({
  query: z.object({
    status: status.optional(),
    priority: priority.optional(),
    project: objectId.optional(),
    assignedTo: objectId.optional(),
    search: z.string().max(120).optional()
  })
});

export const commentSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    body: z.string().min(1).max(2000)
  })
});

const taskPopulate = (query) =>
  query
    .populate("project", "name")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .populate("attachments.uploadedBy", "name email role");

const ensureTaskAccess = (req, task) => {
  if (canManageWork(req.user)) return;
  const assignee = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
  if (assignee !== req.user._id.toString()) {
    throw new ApiError(403, "Members can only access tasks assigned to them");
  }
};

const ensureAssignmentIsValid = async ({ projectId, assignedTo }) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const isMember = project.members.some((memberId) => memberId.toString() === assignedTo.toString());
  if (!isMember) {
    throw new ApiError(400, "Assigned user must be a member of the project");
  }

  return project;
};

const extractMentions = async (body) => {
  const names = [...body.matchAll(/@([a-zA-Z0-9._-]+)/g)].map((match) => match[1].toLowerCase());
  if (!names.length) return [];

  const users = await User.find({
    $or: names.map((name) => ({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
    }))
  }).select("_id");

  return users.map((user) => user._id);
};

export const listTasks = async (req, res, next) => {
  try {
    const { status: taskStatus, priority: taskPriority, project, assignedTo, search } = req.validated.query;
    const filter = {};

    if (taskStatus) filter.status = taskStatus;
    if (taskPriority) filter.priority = taskPriority;
    if (project) filter.project = project;
    if (canManageWork(req.user) && assignedTo) filter.assignedTo = assignedTo;
    if (req.user.role === "Member") filter.assignedTo = req.user._id;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") }
      ];
    }

    const tasks = await taskPopulate(Task.find(filter).sort({ deadline: 1, createdAt: -1 }));
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    await ensureAssignmentIsValid({ projectId: payload.project, assignedTo: payload.assignedTo });

    const task = await Task.create({ ...payload, createdBy: req.user._id });
    const populated = await taskPopulate(Task.findById(task._id));

    await recordActivity(req, {
      action: "created a task",
      entityType: "Task",
      entityId: task._id,
      project: task.project,
      task: task._id,
      metadata: { title: task.title, status: task.status, priority: task.priority }
    });
    await notifyUser(req, {
      recipient: task.assignedTo,
      title: "New task assigned",
      message: `${req.user.name} assigned you "${task.title}".`,
      task: task._id,
      project: task.project
    });

    emitWorkspaceEvent(req, "task:created", populated);
    res.status(201).json({ success: true, task: populated });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const existing = await Task.findById(req.validated.params.id);
    if (!existing) throw new ApiError(404, "Task not found");

    ensureTaskAccess(req, existing);

    const updates = canManageWork(req.user) ? req.validated.body : { status: req.validated.body.status };
    if (req.user.role === "Member" && !updates.status) {
      throw new ApiError(403, "Members can only update task status");
    }

    const nextProject = updates.project || existing.project;
    const nextAssignee = updates.assignedTo || existing.assignedTo;
    if (canManageWork(req.user) && (updates.project || updates.assignedTo)) {
      await ensureAssignmentIsValid({ projectId: nextProject, assignedTo: nextAssignee });
    }

    const task = await taskPopulate(
      Task.findByIdAndUpdate(existing._id, updates, {
        new: true,
        runValidators: true
      })
    );

    await recordActivity(req, {
      action: updates.status && updates.status !== existing.status ? `moved task to ${updates.status}` : "updated a task",
      entityType: "Task",
      entityId: task._id,
      project: task.project?._id || task.project,
      task: task._id,
      metadata: { title: task.title, status: task.status, priority: task.priority }
    });

    if (updates.assignedTo && updates.assignedTo.toString() !== existing.assignedTo.toString()) {
      await notifyUser(req, {
        recipient: updates.assignedTo,
        title: "Task reassigned",
        message: `${req.user.name} assigned you "${task.title}".`,
        task: task._id,
        project: task.project?._id || task.project
      });
    }

    emitWorkspaceEvent(req, "task:updated", task);
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.validated.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    await Comment.deleteMany({ task: task._id });
    await recordActivity(req, {
      action: "deleted a task",
      entityType: "Task",
      entityId: task._id,
      project: task.project,
      task: task._id,
      metadata: { title: task.title }
    });

    emitWorkspaceEvent(req, "task:deleted", { id: task._id });
    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
};

export const listComments = async (req, res, next) => {
  try {
    const task = await Task.findById(req.validated.params.id);
    if (!task) throw new ApiError(404, "Task not found");
    ensureTaskAccess(req, task);

    const comments = await Comment.find({ task: task._id }).populate("author", "name email role").populate("mentions", "name email role").sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.validated.params.id);
    if (!task) throw new ApiError(404, "Task not found");
    ensureTaskAccess(req, task);

    const mentions = await extractMentions(req.validated.body.body);
    const comment = await Comment.create({
      task: task._id,
      author: req.user._id,
      body: req.validated.body.body,
      mentions
    });
    const populated = await comment.populate("author", "name email role");

    await recordActivity(req, {
      action: "commented on a task",
      entityType: "Comment",
      entityId: comment._id,
      project: task.project,
      task: task._id,
      metadata: { title: task.title }
    });

    await Promise.all(
      mentions.map((recipient) =>
        notifyUser(req, {
          recipient,
          title: "You were mentioned",
          message: `${req.user.name} mentioned you on "${task.title}".`,
          task: task._id,
          project: task.project
        })
      )
    );

    emitWorkspaceEvent(req, "comment:created", populated);
    res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    next(error);
  }
};

export const uploadAttachment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.validated.params.id);
    if (!task) throw new ApiError(404, "Task not found");
    ensureTaskAccess(req, task);
    if (!req.file) throw new ApiError(400, "File is required");

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    };

    task.attachments.push(attachment);
    await task.save();
    const populated = await taskPopulate(Task.findById(task._id));

    await recordActivity(req, {
      action: "uploaded a task file",
      entityType: "Task",
      entityId: task._id,
      project: task.project,
      task: task._id,
      metadata: { title: task.title, file: req.file.originalname }
    });

    emitWorkspaceEvent(req, "task:updated", populated);
    res.status(201).json({ success: true, task: populated, attachment });
  } catch (error) {
    next(error);
  }
};
