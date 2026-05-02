import { FolderKanban } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Member" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(form);
      navigate("/login", {
        replace: true,
        state: {
          message: "Account created successfully. Please sign in to continue.",
          email: form.email
        }
      });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-panel px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-white">
            <FolderKanban size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Create FlowBoard account</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Start as an admin or team member.</p>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input mt-1" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input mt-1" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</span>
            <input type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="input mt-1" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Role</span>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="input mt-1">
              <option>Member</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
