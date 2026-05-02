import { Paperclip, Plus, Save, Trash2, UploadCloud, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../api/client";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

const blankProject = { name: "", description: "", members: [] };

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blankProject);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const members = useMemo(() => users.filter((item) => ["Manager", "Member"].includes(item.role)), [users]);
  const canManage = ["Admin", "Manager"].includes(user?.role);
  const isAdmin = user?.role === "Admin";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [projectResponse, userResponse] = await Promise.all([api.get("/projects"), api.get("/users")]);
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
  }, []);

  const reset = () => {
    setForm(blankProject);
    setEditingId("");
  };

  const toggleMember = (id) => {
    setForm((current) => ({
      ...current,
      members: current.members.includes(id) ? current.members.filter((memberId) => memberId !== id) : [...current.members, id]
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      if (editingId) {
        await api.patch(`/projects/${editingId}`, form);
        setMessage("Project updated.");
      } else {
        await api.post("/projects", form);
        setMessage("Project created.");
      }
      reset();
      load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const edit = (project) => {
    setEditingId(project._id);
    setForm({
      name: project.name,
      description: project.description || "",
      members: project.members?.map((member) => member._id) || []
    });
  };

  const remove = async (id) => {
    setError("");
    setMessage("");
    try {
      await api.delete(`/projects/${id}`);
      setMessage("Project deleted.");
      if (editingId === id) reset();
      load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const uploadProject = async (event, project) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      const { data } = await api.post(`/projects/${project._id}/attachments`, body, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProjects((current) => current.map((item) => (item._id === project._id ? data.project : item)));
      setMessage("Project file uploaded.");
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      {canManage ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{editingId ? "Edit project" : "Create project"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Admins and managers manage project scope and team access.</p>
            </div>
            <button type="button" onClick={reset} className="btn-secondary px-3" title="New project">
              <Plus size={18} />
            </button>
          </div>

          {error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div> : null}
          {message ? <div className="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-700 dark:bg-teal-950 dark:text-teal-200">{message}</div> : null}

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input mt-1" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input mt-1 h-28 resize-none" />
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">Members</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {members.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                    <input type="checkbox" checked={form.members.includes(member.id)} onChange={() => toggleMember(member.id)} className="h-4 w-4 rounded border-slate-300 text-brand" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900 dark:text-slate-100">{member.name}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" className="btn-primary">
              <Save size={16} />
              {editingId ? "Update project" : "Create project"}
            </button>
          </form>
        </section>
      ) : null}

      <section className={canManage ? "space-y-4" : "xl:col-span-2 space-y-4"}>
        {error && !canManage ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div> : null}
        {loading ? <div className="text-sm text-slate-500 dark:text-slate-400">Loading projects...</div> : null}
        {!loading && !projects.length ? (
          <EmptyState title="No projects yet" description={canManage ? "Create the first project and invite members to it." : "You have not been added to any projects yet."} />
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => canManage && edit(project)} className="min-w-0 text-left">
                  <h3 className="break-words text-base font-semibold text-slate-950 dark:text-white">{project.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{project.description || "No description"}</p>
                </button>
                {isAdmin ? (
                  <button type="button" onClick={() => remove(project._id)} className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950" title="Delete">
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <UsersRound size={16} />
                {project.members?.length || 0} members
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.members?.slice(0, 5).map((member) => (
                  <span key={member._id} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {member.name}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {canManage ? (
                  <label className="btn-secondary cursor-pointer px-3 py-2 text-xs">
                    <UploadCloud size={14} />
                    Upload project file
                    <input type="file" className="hidden" onChange={(event) => uploadProject(event, project)} />
                  </label>
                ) : null}
                {project.attachments?.length ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Paperclip size={14} />
                    {project.attachments.length} files
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-xs text-slate-400">Updated {formatDate(project.updatedAt)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
