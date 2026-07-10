import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Zap, Shield, Search, Bus, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

export default function LandingPage() {
  const [routes, setRoutes] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/routes").then((r) => setRoutes(r.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#27272a]">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1641355262431-021a396d4fe5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/95 to-transparent" />

        <div className="relative max-w-[1400px] mx-auto px-6 py-24 md:py-32 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 border border-[#00f0ff]/40 text-[#00f0ff] text-[11px] uppercase tracking-[0.25em] mb-6"
            >
              <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full" />
              Real-time Public Transport
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.9]"
            >
              Never miss <br />
              your <span className="text-[#ff0055]">bus</span> <br />
              <span className="text-[#00f0ff]">again.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-8 text-lg text-[#a1a1aa] max-w-xl"
            >
              Track every Bus, Auto, Magic and Van in your city in real time.
              See exactly where your ride is — no more endless waiting on the
              stop.
            </motion.p>

            {/* Search */}
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) {
                  window.location.href = `/passenger?q=${encodeURIComponent(q)}`;
                }
              }}
              className="mt-10 flex items-stretch max-w-xl bg-[#141417] border border-[#27272a] focus-within:border-[#00f0ff]"
            >
              <div className="pl-4 flex items-center text-[#a1a1aa]">
                <Search className="w-5 h-5" />
              </div>
              <input
                data-testid="hero-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Vehicle no., route or city (e.g. UP14AB1234)"
                className="flex-1 bg-transparent px-4 py-4 outline-none placeholder:text-[#52525b] text-white"
              />
              <button
                data-testid="hero-search-btn"
                type="submit"
                className="px-6 bg-[#ff0055] text-black font-medium hover:bg-white transition-colors"
              >
                Track
              </button>
            </motion.form>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/passenger"
                data-testid="cta-passenger"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#27272a] hover:border-white transition-colors"
              >
                Open Live Map <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                data-testid="cta-driver"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00f0ff] text-black hover:bg-white transition-colors"
              >
                <Bus className="w-4 h-4" /> I&apos;m a Driver
              </Link>
            </div>
          </div>

          {/* Right: floating card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="md:col-span-5 hidden md:block"
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-[#ff0055]/10 blur-2xl" />
              <div className="relative bg-[#141417] border border-[#27272a] p-6">
                <div className="flex items-center justify-between text-xs uppercase tracking-widest">
                  <span className="text-[#00f0ff]">// live now</span>
                  <span className="text-[#a1a1aa]">Ghaziabad → Noida</span>
                </div>
                <div className="mt-6 font-display font-black text-6xl tracking-tighter">
                  UP14<span className="text-[#ff0055]">AB</span>1234
                </div>
                <div className="mt-2 text-[#a1a1aa]">Bus · 40 seats · Red</div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <Stat label="Speed" value="42" unit="km/h" />
                  <Stat label="Distance" value="8.3" unit="km" />
                  <Stat label="ETA" value="12" unit="min" />
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff0055] opacity-75 live-ring" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff0055]" />
                  </span>
                  <span className="text-[#a1a1aa] uppercase tracking-widest">
                    Updated 2s ago
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1400px] mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-[#00f0ff] text-xs uppercase tracking-[0.3em]">
              // The platform
            </div>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-tighter mt-2">
              Built for every commuter.
            </h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Feature
            icon={MapPin}
            title="Live GPS Map"
            desc="Every registered vehicle broadcasts its location every 3-5 seconds. See it move in real time on a dark, distraction-free map."
          />
          <Feature
            icon={Zap}
            title="One-Tap Go Live"
            desc="Drivers hit the big Go Live button and their van, auto or bus instantly appears to passengers along their route."
            highlight
          />
          <Feature
            icon={Shield}
            title="Admin Verified"
            desc="Drivers, vehicles and routes are approved by admins so passengers always see legitimate, safe options."
          />
        </div>
      </section>

      {/* Popular Routes */}
      <section className="border-t border-[#27272a] bg-[#0b0b0e]">
        <div className="max-w-[1400px] mx-auto px-6 py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-[#00f0ff] text-xs uppercase tracking-[0.3em]">
                // popular routes
              </div>
              <h2 className="font-display font-black text-4xl md:text-6xl tracking-tighter mt-2">
                Where India moves.
              </h2>
            </div>
            <Link
              to="/routes"
              className="text-sm text-[#00f0ff] hover:text-white"
              data-testid="all-routes-link"
            >
              All routes →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {routes.map((r) => (
              <Link
                key={r.id}
                to={`/passenger?route=${r.id}`}
                data-testid={`route-card-${r.id}`}
                className="group block bg-[#141417] border border-[#27272a] p-6 hover:border-[#ff0055] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
                    {r.city || "India"}
                  </div>
                  <Truck className="w-4 h-4 text-[#00f0ff]" />
                </div>
                <div className="mt-4 font-display font-black text-2xl tracking-tighter leading-tight">
                  {r.origin}
                  <br />
                  <span className="text-[#ff0055]">→ {r.destination}</span>
                </div>
                <div className="mt-4 text-xs text-[#a1a1aa]">
                  {r.stops?.length || 0} stops
                </div>
                <div className="mt-4 text-xs text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity">
                  Track live →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#27272a] py-10 text-center text-xs text-[#52525b]">
        © {new Date().getFullYear()} CityTransit · Local Public Transport Live Tracking
      </footer>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
        {label}
      </div>
      <div className="mt-1 font-display font-black text-2xl leading-none">
        {value}
      </div>
      <div className="text-[10px] text-[#a1a1aa] uppercase">{unit}</div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc, highlight }) {
  return (
    <div
      className={`p-8 border ${
        highlight
          ? "border-[#ff0055] bg-[#141417] pink-border"
          : "border-[#27272a] bg-[#141417]"
      }`}
    >
      <Icon
        className={`w-8 h-8 ${highlight ? "text-[#ff0055]" : "text-[#00f0ff]"}`}
      />
      <h3 className="mt-6 font-display font-bold text-2xl tracking-tight">
        {title}
      </h3>
      <p className="mt-3 text-sm text-[#a1a1aa] leading-relaxed">{desc}</p>
    </div>
  );
}
