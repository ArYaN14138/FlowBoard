import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

export default function CommandPalette({ open, onClose, query, setQuery, results, onSelect }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/40 px-4 pt-24 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Search size={18} className="text-slate-400" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks and projects..." className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white" />
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {results.length ? (
            results.map((item) => (
              <button key={`${item.type}-${item.id}`} type="button" onClick={() => onSelect(item)} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                <span>
                  <span className="block text-sm font-semibold text-slate-950 dark:text-white">{item.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</span>
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.type}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No matching work found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
