import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { formatApiError } from "@/lib/apiClient";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email.toLowerCase().trim(), password);
      toast.success(`Welcome back, ${u.name}`);
      const dest =
        state?.from ||
        (u.role === "driver" ? "/driver" : u.role === "admin" ? "/admin" : "/passenger");
      nav(dest, { replace: true });
    } catch (e2) {
      setError(formatApiError(e2.response?.data?.detail) || e2.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === "admin") {
      setEmail("admin@citytransit.in");
      setPassword("admin123");
    } else if (role === "driver") {
      setEmail("driver@citytransit.in");
      setPassword("driver123");
    } else {
      setEmail("user@citytransit.in");
      setPassword("user123");
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] grid md:grid-cols-2">
      <div
        className="hidden md:block relative"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1766556567056-23ef37ef164d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#09090b]/70" />
        <div className="relative h-full flex flex-col justify-end p-12">
          <div className="text-[#00f0ff] text-xs uppercase tracking-[0.3em]">
            // welcome back
          </div>
          <h2 className="mt-4 font-display font-black text-5xl tracking-tighter leading-none">
            Log in to <br /> track & drive.
          </h2>
          <p className="mt-6 text-[#a1a1aa] max-w-md">
            Passengers see live buses. Drivers go live. Admins keep the network
            humming.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="text-[#00f0ff] text-xs uppercase tracking-[0.3em]">
            // login
          </div>
          <h1 className="mt-4 font-display font-black text-4xl md:text-5xl tracking-tighter">
            Log in.
          </h1>

          <form onSubmit={submit} className="mt-10 space-y-5">
            <div>
              <label className="text-xs uppercase tracking-widest text-[#a1a1aa]">
                Email
              </label>
              <input
                data-testid="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-2 px-4 py-3 bg-[#141417] border border-[#27272a] focus:border-[#00f0ff] outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-[#a1a1aa]">
                Password
              </label>
              <input
                data-testid="login-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-2 px-4 py-3 bg-[#141417] border border-[#27272a] focus:border-[#00f0ff] outline-none"
              />
            </div>

            {error && (
              <div
                data-testid="login-error"
                className="text-sm text-[#ff0055] border border-[#ff0055]/40 px-3 py-2"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              data-testid="login-submit-btn"
              disabled={loading}
              className="w-full py-4 bg-[#ff0055] text-black font-medium hover:bg-white transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="mt-8 border-t border-[#27272a] pt-6">
            <div className="text-xs uppercase tracking-widest text-[#a1a1aa] mb-3">
              Try demo accounts
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                data-testid="demo-admin-btn"
                onClick={() => fillDemo("admin")}
                className="text-xs px-3 py-2 border border-[#27272a] hover:border-[#00f0ff]"
              >
                Admin
              </button>
              <button
                data-testid="demo-driver-btn"
                onClick={() => fillDemo("driver")}
                className="text-xs px-3 py-2 border border-[#27272a] hover:border-[#00f0ff]"
              >
                Driver
              </button>
              <button
                data-testid="demo-passenger-btn"
                onClick={() => fillDemo("passenger")}
                className="text-xs px-3 py-2 border border-[#27272a] hover:border-[#00f0ff]"
              >
                Passenger
              </button>
            </div>
          </div>

          <div className="mt-8 text-sm text-[#a1a1aa]">
            New here?{" "}
            <Link
              to="/register"
              className="text-[#00f0ff] hover:text-white"
              data-testid="go-register-link"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
