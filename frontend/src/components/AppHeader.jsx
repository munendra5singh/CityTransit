import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Bus, LogOut, User, LayoutGrid, MapPin, Shield } from "lucide-react";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const roleLink =
    user && user.role === "driver"
      ? { to: "/driver", label: "Driver Portal", icon: LayoutGrid }
      : user && user.role === "admin"
      ? { to: "/admin", label: "Admin", icon: Shield }
      : { to: "/passenger", label: "Live Map", icon: MapPin };

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#27272a] glass"
      data-testid="app-header"
    >
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          data-testid="brand-link"
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-[#ff0055] rounded-none pink-border">
            <Bus className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-black text-xl tracking-tighter">
              CityTransit
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#00f0ff]">
              live · tracking
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <Link
            to="/passenger"
            data-testid="nav-passenger"
            className={`px-4 py-2 text-sm rounded-none transition-colors ${
              pathname.startsWith("/passenger")
                ? "bg-white text-black"
                : "text-white hover:bg-[#141417]"
            }`}
          >
            Track Vehicles
          </Link>
          <Link
            to="/routes"
            data-testid="nav-routes"
            className={`px-4 py-2 text-sm rounded-none transition-colors ${
              pathname.startsWith("/routes")
                ? "bg-white text-black"
                : "text-white hover:bg-[#141417]"
            }`}
          >
            Routes
          </Link>
          {user && user !== false && (
            <Link
              to={roleLink.to}
              data-testid="nav-role"
              className="px-4 py-2 text-sm rounded-none text-white hover:bg-[#141417]"
            >
              {roleLink.label}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user && user !== false ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#a1a1aa]">
                <User className="w-3.5 h-3.5" />
                <span data-testid="user-name">{user.name}</span>
                <span className="px-2 py-0.5 bg-[#141417] text-[#00f0ff] uppercase tracking-widest text-[10px]">
                  {user.role}
                </span>
              </div>
              <button
                data-testid="logout-btn"
                onClick={async () => {
                  await logout();
                  nav("/");
                }}
                className="p-2 hover:bg-[#141417] transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                data-testid="nav-login"
                className="text-sm px-4 py-2 hover:text-[#00f0ff] transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                data-testid="nav-register"
                className="text-sm px-5 py-2 bg-[#ff0055] text-black font-medium rounded-full hover:bg-white transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
