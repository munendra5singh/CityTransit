import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { formatApiError } from "@/lib/apiClient";
import { toast } from "sonner";
import { User, Bus } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("passenger");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await register({ ...form, email: form.email.toLowerCase().trim(), role });
      toast.success(`Welcome, ${u.name}`);
      nav(role === "driver" ? "/driver" : "/passenger", { replace: true });
    } catch (e2) {
      setError(formatApiError(e2.response?.data?.detail) || e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl">
        <div className="text-[#00f0ff] text-xs uppercase tracking-[0.3em]">
          // create account
        </div>
        <h1 className="mt-4 font-display font-black text-4xl md:text-6xl tracking-tighter">
          Join <span className="text-[#ff0055]">CityTransit</span>.
        </h1>
        <p className="mt-4 text-[#a1a1aa]">Pick your role and get moving.</p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            data-testid="register-role-passenger"
            onClick={() => setRole("passenger")}
            className={`p-6 text-left border transition-colors ${
              role === "passenger"
                ? "border-[#ff0055] bg-[#141417] pink-border"
                : "border-[#27272a] bg-[#141417] hover:border-[#00f0ff]"
            }`}
          >
            <User className="w-6 h-6 text-[#00f0ff]" />
            <div className="mt-4 font-display font-bold text-xl">Passenger</div>
            <div className="text-xs text-[#a1a1aa] mt-1">
              Track vehicles, save routes
            </div>
          </button>
          <button
            data-testid="register-role-driver"
            onClick={() => setRole("driver")}
            className={`p-6 text-left border transition-colors ${
              role === "driver"
                ? "border-[#ff0055] bg-[#141417] pink-border"
                : "border-[#27272a] bg-[#141417] hover:border-[#00f0ff]"
            }`}
          >
            <Bus className="w-6 h-6 text-[#ff0055]" />
            <div className="mt-4 font-display font-bold text-xl">Driver</div>
            <div className="text-xs text-[#a1a1aa] mt-1">
              Register vehicle, go live
            </div>
          </button>
        </div>

        <form onSubmit={submit} className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-widest text-[#a1a1aa]">
              Full Name
            </label>
            <input
              data-testid="register-name-input"
              required
              value={form.name}
              onChange={update("name")}
              className="w-full mt-2 px-4 py-3 bg-[#141417] border border-[#27272a] focus:border-[#00f0ff] outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#a1a1aa]">
              Email
            </label>
            <input
              data-testid="register-email-input"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className="w-full mt-2 px-4 py-3 bg-[#141417] border border-[#27272a] focus:border-[#00f0ff] outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#a1a1aa]">
              Mobile
            </label>
            <input
              data-testid="register-mobile-input"
              value={form.mobile}
              onChange={update("mobile")}
              placeholder="+91..."
              className="w-full mt-2 px-4 py-3 bg-[#141417] border border-[#27272a] focus:border-[#00f0ff] outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-widest text-[#a1a1aa]">
              Password
            </label>
            <input
              data-testid="register-password-input"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
              className="w-full mt-2 px-4 py-3 bg-[#141417] border border-[#27272a] focus:border-[#00f0ff] outline-none"
            />
          </div>

          {error && (
            <div
              data-testid="register-error"
              className="md:col-span-2 text-sm text-[#ff0055] border border-[#ff0055]/40 px-3 py-2"
            >
              {error}
            </div>
          )}

          <button
            data-testid="register-submit-btn"
            type="submit"
            disabled={loading}
            className="md:col-span-2 py-4 bg-[#ff0055] text-black font-medium hover:bg-white transition-colors disabled:opacity-60"
          >
            {loading ? "Creating..." : `Create ${role} account`}
          </button>
        </form>

        <div className="mt-8 text-sm text-[#a1a1aa]">
          Have an account?{" "}
          <Link to="/login" className="text-[#00f0ff] hover:text-white">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
