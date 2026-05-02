export default function StatCard({ label, value, detail, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
    red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">{value}</p>
        </div>
        {Icon ? <div className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}><Icon size={20} /></div> : null}
      </div>
      {detail ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{detail}</p> : null}
    </div>
  );
}
