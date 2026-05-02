import { z } from "zod";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { notifyUser, recordActivity } from "../services/activity.service.js";
import { generateJson, generateText } from "../services/geminiService.js";
import { emitWorkspaceEvent } from "../services/realtime.service.js";
import { ApiError } from "../utils/ApiError.js";

export const generateTaskSchema = z.object({
  body: z.object({
    text: z.string().min(5).max(1000),
    project: z.string().optional()
  })
});

export const generateDescriptionSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(160)
  })
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    project: z.string().optional()
  })
});

const normalizePriority = (value) => {
  const priority = String(value || "Medium").toLowerCase();
  if (priority.includes("high")) return "High";
  if (priority.includes("low")) return "Low";
  return "Medium";
};

const normalizeDate = (value) => {
  const parsed = value ? new Date(value) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed.toISOString();
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  return fallback.toISOString();
};

const fallbackTask = (text, users) => {
  const lower = text.toLowerCase();
  const matchedUser = users.find((user) => lower.includes(user.name.toLowerCase()));
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + (lower.includes("friday") ? (5 - deadline.getDay() + 7) % 7 || 7 : 7));

  return {
    title: text.split(" by ")[0].slice(0, 80) || "New task",
    description: `Complete this work: ${text}`,
    deadline: deadline.toISOString(),
    priority: lower.includes("high") ? "High" : lower.includes("low") ? "Low" : "Medium",
    assignedTo: matchedUser?.id || matchedUser?._id || "",
    assignedToName: matchedUser?.name || ""
  };
};

const serializeTaskDraft = (draft, users) => {
  const assigneeName = draft.assignedToName || draft.assignedTo || "";
  const matchedUser = users.find((user) => user.name.toLowerCase() === String(assigneeName).toLowerCase());

  return {
    title: String(draft.title || "New task").slice(0, 160),
    description: String(draft.description || "").slice(0, 2000),
    deadline: normalizeDate(draft.deadline),
    priority: normalizePriority(draft.priority),
    assignedTo: matchedUser?._id?.toString() || matchedUser?.id || (draft.assignedToId || ""),
    assignedToName: matchedUser?.name || assigneeName
  };
};

export const generateTask = async (req, res, next) => {
  try {
    const { text } = req.validated.body;
    const users = await User.find().select("name email role").lean();
    const userList = users.map((user) => `${user.name} (${user.role})`).join(", ");
    const today = new Date().toISOString().slice(0, 10);

    const prompt = `
Convert the user's sentence into valid JSON only.
Today is ${today}.
Available assignees: ${userList || "none"}.
Fields:
{
  "title": "short task title",
  "description": "professional task description",
  "deadline": "ISO date string",
  "priority": "Low | Medium | High",
  "assignedToName": "best matching assignee name or empty string"
}
Sentence: "${text}"
Return only JSON.`;

    const draft = await generateJson(prompt, () => fallbackTask(text, users));
    res.json({ success: true, task: serializeTaskDraft(draft, users) });
  } catch (error) {
    next(error);
  }
};

export const generateDescription = async (req, res, next) => {
  try {
    const { title } = req.validated.body;
    const prompt = `
Write a concise professional task description for this project management task.
Return JSON only in this shape:
{ "description": "..." }
Task title: "${title}"`;

    const result = await generateJson(prompt, () => ({
      description: `Plan, implement, review, and verify the work for "${title}". Include acceptance criteria, ownership, and any dependencies before marking it complete.`
    }));

    res.json({ success: true, description: String(result.description || "").slice(0, 2000) });
  } catch (error) {
    next(error);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const canSeeAll = ["Admin", "Manager"].includes(req.user.role);
    const filter = canSeeAll ? {} : { assignedTo: req.user._id };
    const tasks = await Task.find(filter).populate("project", "name").populate("assignedTo", "name role").sort({ deadline: 1 }).limit(80).lean();
    const now = new Date();
    const overdue = tasks.filter((task) => task.status !== "Done" && new Date(task.deadline) < now);
    const completed = tasks.filter((task) => task.status === "Done");

    const fallback = {
      summary: `${completed.length} of ${tasks.length} tracked tasks are complete.`,
      warnings: overdue.length ? [`${overdue.length} tasks are overdue and need triage.`] : ["No overdue tasks in the current view."],
      suggestions: ["Review high-priority tasks first.", "Move blocked work into smaller tasks.", "Keep deadlines visible during daily planning."]
    };

    const prompt = `
Analyze this project task dataset and return valid JSON only.
Fields:
{
  "summary": "one sentence productivity summary",
  "warnings": ["short overdue/risk warnings"],
  "suggestions": ["actionable next steps"]
}
Tasks JSON:
${JSON.stringify(tasks.map((task) => ({
  title: task.title,
  status: task.status,
  priority: task.priority,
  deadline: task.deadline,
  project: task.project?.name,
  assignedTo: task.assignedTo?.name
})))};`;

    const insights = await generateJson(prompt, () => fallback);
    res.json({ success: true, insights });
  } catch (error) {
    next(error);
  }
};

export const chat = async (req, res, next) => {
  try {
    const { message, project } = req.validated.body;
    const tasks = await Task.find(project ? { project } : {}).populate("project", "name").populate("assignedTo", "name role").sort({ updatedAt: -1 }).limit(40).lean();
    const projects = await Project.find().populate("members", "name role").sort({ updatedAt: -1 }).limit(20).lean();
    const users = await User.find().select("name role").lean();

    const wantsCreate = /\b(create|add|make)\b/i.test(message) && /\btask\b/i.test(message);
    if (wantsCreate && ["Admin", "Manager"].includes(req.user.role)) {
      const draftResponse = await generateJson(
        `Convert this request to JSON only with fields title, description, deadline, priority, assignedToName. Users: ${users.map((user) => user.name).join(", ")}. Request: "${message}"`,
        () => fallbackTask(message, users)
      );
      const draft = serializeTaskDraft(draftResponse, users);
      const targetProject = project || projects[0]?._id?.toString();
      if (!targetProject || !draft.assignedTo) {
        return res.json({
          success: true,
          reply: "I drafted the task, but I need a project and a matching assignee before I can create it.",
          draft
        });
      }

      const task = await Task.create({
        title: draft.title,
        description: draft.description,
        deadline: draft.deadline,
        priority: draft.priority,
        status: "Todo",
        assignedTo: draft.assignedTo,
        project: targetProject,
        createdBy: req.user._id
      });
      const populated = await Task.findById(task._id).populate("project", "name").populate("assignedTo", "name email role").populate("createdBy", "name email role");
      await recordActivity(req, {
        action: "created a task with AI",
        entityType: "Task",
        entityId: task._id,
        project: task.project,
        task: task._id,
        metadata: { title: task.title, priority: task.priority }
      });
      await notifyUser(req, {
        recipient: task.assignedTo,
        title: "AI-created task assigned",
        message: `${req.user.name} assigned you "${task.title}" using AI.`,
        task: task._id,
        project: task.project
      });
      emitWorkspaceEvent(req, "task:created", populated);

      return res.status(201).json({
        success: true,
        reply: `Created "${task.title}" and assigned it to ${populated.assignedTo?.name}.`,
        action: "task_created",
        task: populated
      });
    }

    const prompt = `
You are FlowBoard AI, a concise project management assistant.
Answer the user's question, suggest next actions, and reference current tasks/projects when useful.
Do not invent data.
User message: "${message}"
Projects: ${JSON.stringify(projects.map((item) => ({ name: item.name, members: item.members?.map((member) => member.name) })))}
Tasks: ${JSON.stringify(tasks.map((task) => ({ title: task.title, status: task.status, priority: task.priority, deadline: task.deadline, project: task.project?.name, assignedTo: task.assignedTo?.name })))}`;

    let reply;
    try {
      reply = await generateText(prompt);
    } catch (_error) {
      reply = `I found ${tasks.length} recent tasks across ${projects.length} projects. Start with overdue or high-priority work, then move active tasks toward Done.`;
    }

    res.json({ success: true, reply });
  } catch (error) {
    next(error);
  }
};
