import { CalendarDays, List, MessageSquare, Plus, Save, Search, Sparkles, Table2, Trash2, UploadCloud, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../api/client";
import { createSocket } from "../api/socket";
import EmptyState from "../components/EmptyState";
import TaskCard from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

const blankTask = { title: "", description: "", deadline: "", project: "", assignedTo: "", status: "Todo", priority: "Medium" };
const statuses = ["Todo", "In Progress", "Done"];
const priorities = ["Low", "Medium", "High"];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blankTask);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ status: "", project: "", priority: "", search: "" });
  const [view, setView] = useState("kanban");
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragged, setDragged] = useState(null);

  const canManage = ["Admin", "Manager"].includes(user?.role);
  const selectedProject = useMemo(() => projects.find((project) => project._id === form.project), [projects, form.project]);
  const assignableMembers = selectedProject?.members || users.filter((item) => ["Manager", "Member"].includes(item.role));

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const [taskResponse, projectResponse, userResponse] = await Promise.all([
        api.get(`/tasks${params.toString() ? `?${params}` : ""}`),
        api.get("/projects"),
        api.get("/users")
      ]);
      setTasks(taskResponse.data.tasks);
      setProjects(projectResponse.data.projects);
      setUsers(userResponse.data.users);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.status, filters.project, filters.priority]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    const socket = createSocket();
    socket.connect();
    socket.on("task:created", (task) => setTasks((current) => [task, ...current]));
    socket.on("task:updated", (task) => setTasks((current) => current.map((item) => (item._id === task._id ? task : item))));
    socket.on("task:deleted", ({ id }) => setTasks((current) => current.filter((item) => item._id !== id)));
    socket.on("comment:created", (comment) => {
      if (selectedTask?._id === comment.task) setComments((current) => [...current, comment]);
    });
    return () => socket.disconnect();
  }, [selectedTask?._id]);

  const reset = () => {
    setForm(blankTask);
    setEditingId("");
  };

  const applyAiTask = (task) => {
    setForm((current) => ({
      ...current,
      title: task.title || current.title,
      description: task.description || current.description,
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : current.deadline,
      priority: task.priority || current.priority,
      assignedTo: task.assignedTo || current.assignedTo
    }));
  };

  const generateTaskWithAi = async () => {
    if (!aiInput.trim()) {
      setError("Describe the task in natural language first.");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      const { data } = await api.post("/ai/generate-task", {
        text: aiInput,
        project: form.project || undefined
      });
      applyAiTask(data.task);
      setMessage("AI generated a structured task draft.");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setAiLoading(false);
    }
  };

  const generateDescriptionWithAi = async () => {
    if (!form.title.trim()) {
      setError("Add a title before generating a description.");
      return;
    }
    setDescriptionLoading(true);
    setError("");
    try {
      const { data } = await api.post("/ai/generate-description", { title: form.title });
      setForm((current) => ({ ...current, description: data.description }));
      setMessage("AI generated a professional task description.");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setDescriptionLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = { ...form, deadline: new Date(form.deadline).toISOString() };
      if (editingId) {
        await api.patch(`/tasks/${editingId}`, payload);
        setMessage("Task updated.");
      } else {
        await api.post("/tasks", payload);
        setMessage("Task created.");
      }
      reset();
      load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const updateStatus = async (task, status) => {
    setError("");
    try {
      const { data } = await api.patch(`/tasks/${task._id}`, { status });
      setTasks((current) => current.map((item) => (item._id === task._id ? data.task : item)));
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const edit = (task) => {
    setEditingId(task._id);
    setForm({
      title: task.title,
      description: task.description || "",
      deadline: new Date(task.deadline).toISOString().slice(0, 10),
      project: task.project?._id || task.project,
      assignedTo: task.assignedTo?._id || task.assignedTo,
      status: task.status,
      priority: task.priority || "Medium"
    });
  };

  const remove = async (id) => {
    setError("");
    setMessage("");
    try {
      await api.delete(`/tasks/${id}`);
      setMessage("Task deleted.");
      load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const openTask = async (task) => {
    setSelectedTask(task);
    try {
      const { data } = await api.get(`/tasks/${task._id}/comments`);
      setComments(data.comments);
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!selectedTask || !commentBody.trim()) return;
    const { data } = await api.post(`/tasks/${selectedTask._id}/comments`, { body: commentBody });
    setComments((current) => [...current, data.comment]);
    setCommentBody("");
  };

  const uploadFile = async (event, task = selectedTask) => {
    const file = event.target.files?.[0];
    if (!file || !task) return;
    const body = new FormData();
    body.append("file", file);
    const { data } = await api.post(`/tasks/${task._id}/attachments`, body, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    setTasks((current) => current.map((item) => (item._id === task._id ? data.task : item)));
    setSelectedTask(data.task);
  };

  const grouped = statuses.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status)
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
            <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search tasks..." className="input pl-9" />
          </div>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="input max-w-xs py-2">
            <option value="">All statuses</option>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })} className="input max-w-xs py-2">
            <option value="">All priorities</option>
            {priorities.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
          <select value={filters.project} onChange={(event) => setFilters({ ...filters, project: event.target.value })} className="input max-w-xs py-2">
            <option value="">All projects</option>
            {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
          </select>
          <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
            {[
              ["kanban", Table2],
              ["list", List],
              ["calendar", CalendarDays]
            ].map(([item, Icon]) => (
              <button key={item} type="button" onClick={() => setView(item)} className={`rounded-md px-3 py-2 ${view === item ? "bg-brand text-white" : "text-slate-500 dark:text-slate-300"}`}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {canManage ? (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{editingId ? "Edit task" : "Create task"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Plan priority, owner, and deadline in one pass.</p>
            </div>
            <button type="button" onClick={reset} className="btn-secondary px-3" title="New task"><Plus size={18} /></button>
          </div>

          {error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div> : null}
          {message ? <div className="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-700 dark:bg-teal-950 dark:text-teal-200">{message}</div> : null}

          <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-950 dark:bg-blue-950/30">
            <label className="block">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <Sparkles size={16} className="text-brand" />
                AI task generator
              </span>
              <textarea
                value={aiInput}
                onChange={(event) => setAiInput(event.target.value)}
                className="input mt-2 h-20 resize-none"
                placeholder="Example: Build login API by Friday and assign to Aryan with high priority"
              />
            </label>
            <button type="button" onClick={generateTaskWithAi} disabled={aiLoading} className="btn-primary mt-3">
              <Wand2 size={16} />
              {aiLoading ? "Generating..." : "Generate with AI"}
            </button>
          </div>

          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
            <label className="block"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input mt-1" required /></label>
            <label className="block"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">Deadline</span><input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} className="input mt-1" required /></label>
            <label className="block"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">Priority</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="input mt-1">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
            <label className="block"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">Project</span><select value={form.project} onChange={(event) => setForm({ ...form, project: event.target.value, assignedTo: "" })} className="input mt-1" required><option value="">Select project</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label>
            <label className="block"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">Assignee</span><select value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} className="input mt-1" required><option value="">Select member</option>{assignableMembers.map((member) => <option key={member._id || member.id} value={member._id || member.id}>{member.name}</option>)}</select></label>
            <label className="block"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="input mt-1">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="block lg:col-span-3">
              <span className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Description
                <button type="button" onClick={generateDescriptionWithAi} disabled={descriptionLoading} className="btn-secondary px-3 py-1.5 text-xs">
                  <Sparkles size={14} />
                  {descriptionLoading ? "Writing..." : "Generate description"}
                </button>
              </span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input mt-1 h-24 resize-none" />
            </label>
            <div className="lg:col-span-3"><button type="submit" className="btn-primary"><Save size={16} />{editingId ? "Update task" : "Create task"}</button></div>
          </form>
        </motion.section>
      ) : error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div> : null}

      {loading ? <div className="text-sm text-slate-500 dark:text-slate-400">Loading tasks...</div> : null}
      {!loading && !tasks.length ? <EmptyState title="No tasks found" description="Try clearing filters or create a new task for a project member." /> : null}

      {view === "kanban" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {grouped.map((column) => (
            <section key={column.status} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragged) updateStatus(dragged, column.status); setDragged(null); }} className="min-h-72 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{column.status}</h2><span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{column.tasks.length}</span></div>
              <div className="space-y-3">
                {column.tasks.map((task) => (
                  <div key={task._id}>
                    <TaskCard task={task} draggable onDragStart={(_event, item) => setDragged(item)} onStatusChange={updateStatus} onSelect={openTask} />
                    {canManage ? <div className="mt-2 flex gap-2"><button type="button" onClick={() => edit(task)} className="btn-secondary px-3 py-2 text-xs">Edit</button><button type="button" onClick={() => remove(task._id)} className="btn-secondary px-3 py-2 text-xs text-red-600"><Trash2 size={14} /></button></div> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {view === "list" ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {tasks.map((task) => (
            <button key={task._id} type="button" onClick={() => openTask(task)} className="grid w-full gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 md:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr]">
              <span className="font-semibold text-slate-950 dark:text-white">{task.title}</span>
              <span className="text-slate-500 dark:text-slate-400">{task.project?.name}</span>
              <span className="text-slate-500 dark:text-slate-400">{task.priority}</span>
              <span className="text-slate-500 dark:text-slate-400">{formatDate(task.deadline)}</span>
            </button>
          ))}
        </section>
      ) : null}

      {view === "calendar" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => <TaskCard key={task._id} task={task} onStatusChange={updateStatus} onSelect={openTask} />)}
        </div>
      ) : null}

      {selectedTask ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-lift dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{selectedTask.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedTask.project?.name} / {selectedTask.status} / {selectedTask.priority}</p>
              </div>
              <button type="button" onClick={() => setSelectedTask(null)} className="btn-secondary">Close</button>
            </div>
            <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selectedTask.description || "No description"}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <label className="btn-primary cursor-pointer">
                <UploadCloud size={16} />
                Upload file
                <input type="file" className="hidden" onChange={uploadFile} />
              </label>
              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                <MessageSquare size={16} />
                {comments.length} comments
              </span>
            </div>

            <div className="mt-5 space-y-2">
              {selectedTask.attachments?.map((file) => (
                <a key={file.filename} href={`${api.defaults.baseURL.replace(/\/api$/, "")}${file.url}`} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-brand dark:border-slate-700">
                  {file.originalName}
                </a>
              ))}
            </div>

            <form onSubmit={addComment} className="mt-6 flex gap-2">
              <input value={commentBody} onChange={(event) => setCommentBody(event.target.value)} className="input" placeholder="Comment with @name mentions..." />
              <button type="submit" className="btn-primary">Send</button>
            </form>
            <div className="mt-5 space-y-3">
              {comments.map((comment) => (
                <article key={comment._id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{comment.author?.name}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{comment.body}</p>
                </article>
              ))}
            </div>
          </motion.section>
        </div>
      ) : null}
    </div>
  );
}
