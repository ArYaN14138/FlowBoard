import { CalendarDays, Flag, GripVertical, Paperclip, UserRound } from "lucide-react";
import { formatDate, isOverdue } from "../utils/format";

const statusClass = {
  Todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  "In Progress": "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  Done: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200"
};

const priorityClass = {
  Low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  Medium: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  High: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"
};

export default function TaskCard({ task, draggable = false, onDragStart, onStatusChange, onSelect, canEditStatus = true }) {
  const overdue = isOverdue(task.deadline) && task.status !== "Done";

  return (
    <article
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(event, task)}
      onClick={() => onSelect?.(task)}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold text-slate-950 dark:text-white">{task.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{task.description || "No description"}</p>
        </div>
        {draggable ? <GripVertical className="shrink-0 text-slate-300" size={18} /> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass[task.status]}`}>{task.status}</span>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${priorityClass[task.priority || "Medium"]}`}>
          <Flag size={12} />
          {task.priority || "Medium"}
        </span>
        {overdue ? <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">Overdue</span> : null}
        <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {task.project?.name || "No project"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <UserRound size={14} />
          {task.assignedTo?.name || "Unassigned"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={14} />
          {formatDate(task.deadline)}
        </span>
        {task.attachments?.length ? (
          <span className="inline-flex items-center gap-1">
            <Paperclip size={14} />
            {task.attachments.length}
          </span>
        ) : null}
      </div>

      {canEditStatus ? (
        <select className="input mt-4 py-2 text-xs" value={task.status} onChange={(event) => onStatusChange?.(task, event.target.value)}>
          <option>Todo</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
      ) : null}
    </article>
  );
}
