import { Activity } from "../models/Activity.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const canSeeAll = ["Admin", "Manager"].includes(req.user.role);
    const taskFilter = canSeeAll ? {} : { assignedTo: req.user._id };
    const projectFilter = canSeeAll ? {} : { members: req.user._id };

    const weekStart = startOfDay(new Date(now));
    weekStart.setDate(weekStart.getDate() - 6);

    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      todoTasks,
      inProgressTasks,
      highPriorityTasks,
      totalProjects,
      recentTasks,
      activities,
      weeklyDone
    ] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: "Done" }),
      Task.countDocuments({ ...taskFilter, status: { $ne: "Done" }, deadline: { $lt: now } }),
      Task.countDocuments({ ...taskFilter, status: "Todo" }),
      Task.countDocuments({ ...taskFilter, status: "In Progress" }),
      Task.countDocuments({ ...taskFilter, priority: "High", status: { $ne: "Done" } }),
      Project.countDocuments(projectFilter),
      Task.find(taskFilter).populate("project", "name").populate("assignedTo", "name email role").sort({ updatedAt: -1 }).limit(6),
      Activity.find(canSeeAll ? {} : { $or: [{ actor: req.user._id }, { task: { $exists: true } }] })
        .populate("actor", "name email role")
        .populate("project", "name")
        .populate("task", "title")
        .sort({ createdAt: -1 })
        .limit(12),
      Task.aggregate([
        { $match: { ...taskFilter, status: "Done", updatedAt: { $gte: weekStart } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const weeklyProductivity = Array.from({ length: 7 }, (_, index) => {
      const date = startOfDay(new Date(weekStart));
      date.setDate(weekStart.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const found = weeklyDone.find((item) => item._id === key);
      return {
        date: key,
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        completed: found?.count || 0
      };
    });

    res.json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks,
        todoTasks,
        inProgressTasks,
        highPriorityTasks,
        totalProjects
      },
      charts: {
        status: [
          { label: "Todo", value: todoTasks },
          { label: "In Progress", value: inProgressTasks },
          { label: "Done", value: completedTasks }
        ],
        weeklyProductivity
      },
      recentTasks,
      activities
    });
  } catch (error) {
    next(error);
  }
};
