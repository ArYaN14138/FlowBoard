const colors = ["#2563eb", "#14b8a6", "#f97316", "#ef4444"];

export function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 25;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 42 42" className="h-36 w-36 shrink-0 rotate-[-90deg]">
        <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="7" />
        {data.map((item, index) => {
          const dash = (item.value / total) * 100;
          const circle = <circle key={item.label} cx="21" cy="21" r="15.9" fill="transparent" stroke={colors[index]} strokeWidth="7" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={offset} />;
          offset -= dash;
          return circle;
        })}
      </svg>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index] }} />
            <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
            <span className="font-semibold text-slate-950 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({ data }) {
  const max = Math.max(...data.map((item) => item.completed), 1);

  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((item) => (
        <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end rounded-md bg-slate-100 p-1 dark:bg-slate-800">
            <div className="w-full rounded bg-brand transition-all" style={{ height: `${Math.max((item.completed / max) * 100, item.completed ? 10 : 0)}%` }} />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
