import mongoose from "mongoose";
import { z } from "zod";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { recordActivity } from "../services/activity.service.js";
import { emitWorkspaceEvent } from "../services/realtime.service.js";
import { ApiError } from "../utils/ApiError.js";

const objectId = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid id");

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    description: z.string().max(1000).optional().default(""),
    members: z.array(objectId).optional().default([])
  })
});

export const updateProjectSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(1000).optional(),
    members: z.array(objectId).optional()
  })
});

export const projectParamsSchema = z.object({
  params: z.object({ id: objectId })
});

const populateProject = (query) =>
  query
    .populate("members", "name email role")
    .populate("createdBy", "name email role")
    .populate("attachments.uploadedBy", "name email role")
    .sort({ updatedAt: -1 });

const ensureMembersExist = async (memberIds) => {
  const uniqueIds = [...new Set(memberIds.map(String))];
  if (!uniqueIds.length) return uniqueIds;

    const count = await User.countDocuments({ _id: { $in: uniqueIds }, role: { $in: ["Admin", "Manager", "Member"] } });
  if (count !== uniqueIds.length) {
    throw new ApiError(400, "One or more project members do not exist");
  }

  return uniqueIds;
};

export const listProjects = async (req, res, next) => {
  try {
    const filter = ["Admin", "Manager"].includes(req.user.role) ? {} : { members: req.user._id };
    const projects = await populateProject(Project.find(filter));
    res.json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description, members } = req.validated.body;
    const projectMembers = await ensureMembersExist([...members, req.user._id.toString()]);

    const project = await Project.create({
      name,
      description,
      members: projectMembers,
      createdBy: req.user._id
    });

    const populated = await populateProject(Project.findById(project._id));
    await recordActivity(req, {
      action: "created a project",
      entityType: "Project",
      entityId: project._id,
      project: project._id,
      metadata: { name: project.name }
    });
    emitWorkspaceEvent(req, "project:created", populated);
    res.status(201).json({ success: true, project: populated });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const updates = { ...req.validated.body };
    if (updates.members) {
      updates.members = await ensureMembersExist(updates.members);
    }

    const project = await Project.findByIdAndUpdate(req.validated.params.id, updates, {
      new: true,
      runValidators: true
    })
      .populate("members", "name email role")
      .populate("createdBy", "name email role");

    if (!project) throw new ApiError(404, "Project not found");

    await recordActivity(req, {
      action: "updated a project",
      entityType: "Project",
      entityId: project._id,
      project: project._id,
      metadata: { name: project.name }
    });
    emitWorkspaceEvent(req, "project:updated", project);
    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.validated.params.id);
    if (!project) throw new ApiError(404, "Project not found");

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    await recordActivity(req, {
      action: "deleted a project",
      entityType: "Project",
      entityId: project._id,
      metadata: { name: project.name }
    });
    emitWorkspaceEvent(req, "project:deleted", { id: project._id });
    res.json({ success: true, message: "Project and related tasks deleted" });
  } catch (error) {
    next(error);
  }
};

export const uploadProjectAttachment = async (req, res, next) => {
  try {
    const project = await Project.findById(req.validated.params.id);
    if (!project) throw new ApiError(404, "Project not found");
    if (!req.file) throw new ApiError(400, "File is required");

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    };
    project.attachments.push(attachment);
    await project.save();

    const populated = await populateProject(Project.findById(project._id));
    await recordActivity(req, {
      action: "uploaded a project file",
      entityType: "Project",
      entityId: project._id,
      project: project._id,
      metadata: { name: project.name, file: req.file.originalname }
    });
    emitWorkspaceEvent(req, "project:updated", populated);
    res.status(201).json({ success: true, project: populated, attachment });
  } catch (error) {
    next(error);
  }
};
