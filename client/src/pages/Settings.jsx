import { Moon, ShieldCheck, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-200">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Account</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your role controls which project and task actions are available.</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Role</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{user?.role}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Switch between light and dark mode.</p>
          </div>
          <button type="button" onClick={toggleTheme} className="btn-secondary">
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
            {isDark ? "Use light mode" : "Use dark mode"}
          </button>
        </div>
      </section>
    </div>
  );
}
