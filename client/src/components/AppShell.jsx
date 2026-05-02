import {
  CheckCircle2,
  Bell,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { createSocket } from "../api/socket";
import AIChatPanel from "./AIChatPanel";
import CommandPalette from "./CommandPalette";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { formatDate } from "../utils/format";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: CheckCircle2 },
  { to: "/settings", label: "Settings", icon: Settings }
];

const titles = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/settings": "Settings"
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || "Workspace";

  useEffect(() => {
    Promise.all([api.get("/tasks"), api.get("/projects"), api.get("/notifications")])
      .then(([taskResponse, projectResponse, notificationResponse]) => {
        setTasks(taskResponse.data.tasks);
        setProjects(projectResponse.data.projects);
        setNotifications(notificationResponse.data.notifications);
      })
      .catch(() => {});

    const socket = createSocket();
    socket.connect();
    socket.on("task:created", (task) => setTasks((current) => [task, ...current]));
    socket.on("task:updated", (task) => setTasks((current) => current.map((item) => (item._id === task._id ? task : item))));
    socket.on("task:deleted", ({ id }) => setTasks((current) => current.filter((item) => item._id !== id)));
    socket.on("project:created", (project) => setProjects((current) => [project, ...current]));
    socket.on("project:updated", (project) => setProjects((current) => current.map((item) => (item._id === project._id ? project : item))));
    socket.on("notification:created", (notification) => setNotifications((current) => [notification, ...current]));

    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      socket.disconnect();
    };
  }, []);

  const commandResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return [
      ...projects
        .filter((project) => project.name.toLowerCase().includes(term))
        .map((project) => ({ id: project._id, type: "Project", title: project.name, subtitle: `${project.members?.length || 0} members`, to: "/projects" })),
      ...tasks
        .filter((task) => `${task.title} ${task.description || ""}`.toLowerCase().includes(term))
        .map((task) => ({ id: task._id, type: "Task", title: task.title, subtitle: `${task.status} / ${task.priority || "Medium"}`, to: "/tasks" }))
    ].slice(0, 8);
  }, [projects, query, tasks]);

  const unread = notifications.filter((item) => !item.read).length;

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const toggleNotifications = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (!nextOpen) return;

    await loadNotifications();
    if (unread) {
      await api.patch("/notifications/read");
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white">
            <FolderKanban size={20} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-950 dark:text-white">FlowBoard</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Project command center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-brand dark:bg-blue-950/50 dark:text-blue-300"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
            <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-200">
              {user?.role}
            </span>
          </div>
        </div>
        <button type="button" onClick={logout} className="btn-secondary w-full">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-panel dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 bg-white shadow-lift dark:bg-slate-900">{sidebar}</aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Open navigation" onClick={() => setOpen(true)} className="btn-secondary px-3 lg:hidden">
                <Menu size={18} />
              </button>
              <div>
              <motion.h1 layout className="text-xl font-semibold text-slate-950 dark:text-white md:text-2xl">{title}</motion.h1>
                <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
                  Plan work, assign owners, and keep deadlines visible.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPaletteOpen(true)} className="btn-secondary hidden sm:inline-flex">
                <span className="text-slate-400">Ctrl K</span>
                Search
              </button>
              <div className="relative">
                <button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} className="btn-secondary relative px-3" onClick={toggleNotifications}>
                  <Bell size={18} />
                  {unread ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span> : null}
                </button>
                {notificationsOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-12 z-50 w-[min(92vw,24rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">Notifications</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Assignment, mention, and deadline updates</p>
                      </div>
                      <button type="button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X size={17} />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2">
                      {notificationsLoading ? <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading notifications...</p> : null}
                      {!notificationsLoading && notifications.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
                      ) : null}
                      {!notificationsLoading &&
                        notifications.map((notification) => (
                          <button
                            key={notification._id}
                            type="button"
                            onClick={() => {
                              setNotificationsOpen(false);
                              if (notification.task) navigate("/tasks");
                            }}
                            className="flex w-full gap-3 rounded-lg px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read ? "bg-slate-300 dark:bg-slate-600" : "bg-brand"}`} />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">{notification.title}</span>
                              <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-300">{notification.message}</span>
                              <span className="mt-1 block text-xs text-slate-400">{formatDate(notification.createdAt)}</span>
                            </span>
                          </button>
                        ))}
                    </div>
                  </motion.div>
                ) : null}
              </div>
              <button type="button" aria-label="Toggle dark mode" onClick={toggleTheme} className="btn-secondary px-3">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        query={query}
        setQuery={setQuery}
        results={commandResults}
        onSelect={(item) => {
          setPaletteOpen(false);
          navigate(item.to);
        }}
      />
      <AIChatPanel />
    </div>
  );
}
