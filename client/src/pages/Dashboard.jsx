import { AlertTriangle, CheckCircle2, Clock3, Flame, Lightbulb, ListTodo, Sparkles, TimerReset, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, getApiError } from "../api/client";
import { createSocket } from "../api/socket";
import { BarChart, DonutChart } from "../components/Charts";
import StatCard from "../components/StatCard";
import TaskCard from "../components/TaskCard";
import { formatDate, formatNumber } from "../utils/format";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/dashboard")
      .then(({ data: response }) => setData(response))
      .catch((err) => setError(getApiError(err)));

  useEffect(() => {
    load();
    api.get("/ai/insights").then(({ data }) => setInsights(data.insights)).catch(() => {
      setInsights({
        summary: "AI insights are unavailable until Gemini is configured.",
        warnings: [],
        suggestions: ["Add GEMINI_API_KEY to server/.env to enable live AI analysis."]
      });
    });
    const socket = createSocket();
    socket.connect();
    socket.on("task:created", load);
    socket.on("task:updated", load);
    socket.on("task:deleted", load);
    socket.on("activity:created", load);
    return () => socket.disconnect();
  }, []);

  if (error) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>;
  if (!data) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard...</div>;

  const { stats, recentTasks, charts, activities } = data;
  const total = Math.max(stats.totalTasks, 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          <StatCard label="Total tasks" value={formatNumber(stats.totalTasks)} detail={`${formatNumber(stats.totalProjects)} active projects`} icon={ListTodo} />,
          <StatCard label="Completed" value={formatNumber(stats.completedTasks)} detail={`${Math.round((stats.completedTasks / total) * 100)}% completion rate`} icon={CheckCircle2} tone="teal" />,
          <StatCard label="Overdue" value={formatNumber(stats.overdueTasks)} detail="Past deadline" icon={AlertTriangle} tone="red" />,
          <StatCard label="In progress" value={formatNumber(stats.inProgressTasks)} detail="Currently moving" icon={TimerReset} tone="amber" />,
          <StatCard label="High priority" value={formatNumber(stats.highPriorityTasks)} detail="Needs attention" icon={Flame} tone="red" />
        ].map((card, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            {card}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Task status</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pie chart view of delivery flow.</p>
            </div>
            <TrendingUp className="text-brand" size={22} />
          </div>
          <DonutChart data={charts.status} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-2">
            <CheckCircle2 className="text-brand" size={20} />
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Weekly productivity</h2>
          </div>
          <BarChart data={charts.weeklyProductivity} />
        </section>
      </div>

      <section className="rounded-lg border border-blue-100 bg-blue-50/70 p-5 shadow-sm dark:border-blue-950 dark:bg-blue-950/30">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="text-brand" size={20} />
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">AI dashboard insights</h2>
        </div>
        {insights ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-4 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{insights.summary}</p>
            </div>
            <div className="rounded-lg bg-white p-4 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Warnings</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {(insights.warnings || []).map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-lg bg-white p-4 dark:bg-slate-900">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400"><Lightbulb size={14} /> Suggestions</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {(insights.suggestions || []).map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Generating AI insights...</p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-2">
            <Clock3 className="text-brand" size={20} />
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent activity chart</h2>
          </div>
          <div className="space-y-4">
            {activities.length ? (
              activities.map((activity) => (
                <div key={activity._id} className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      <span className="font-semibold">{activity.actor?.name || "Someone"}</span> {activity.action}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activity.metadata?.title || activity.metadata?.name || activity.task?.title || activity.project?.name || "Workspace"} / {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-5 text-lg font-semibold text-slate-950 dark:text-white">Recently updated tasks</h2>
          <div className="grid gap-3">
            {recentTasks.length ? recentTasks.map((task) => <TaskCard key={task._id} task={task} canEditStatus={false} />) : <p className="text-sm text-slate-500 dark:text-slate-400">No tasks yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
