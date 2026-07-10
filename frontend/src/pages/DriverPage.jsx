import { useEffect, useState, useRef } from "react";
import { api, formatApiError } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import LiveMap from "@/components/LiveMap";
import { Radio, Truck, MapPin, Plus, LogOut as OfflineIcon } from "lucide-react";

export default function DriverPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [session, setSession] = useState(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [tick, setTick] = useState(0);
  const watchIdRef = useRef(null);

  const loadAll = async () => {
    const [vs, rs, s] = await Promise.all([
      api.get("/vehicles"),
      api.get("/routes"),
      api.get("/driver/session"),
    ]);
    setVehicles(vs.data);
    setRoutes(rs.data);
    setSession(s.data.is_live === false ? null : s.data);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Timer for online time
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // GPS watch when live
  useEffect(() => {
    if (!session || !session.is_live) {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Browser does not support GPS");
      return;
    }
    let lastSent = 0;
    const onPos = async (pos) => {
      const now = Date.now();
      if (now - lastSent < 3500) return;
      lastSent = now;
      try {
        const { data } = await api.post("/driver/location", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed: (pos.coords.speed || 0) * 3.6,
          heading: pos.coords.heading || 0,
        });
        setSession((s) =>
          s
            ? {
                ...s,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                speed: (pos.coords.speed || 0) * 3.6,
                distance_km: data.distance_km,
                last_update: new Date().toISOString(),
              }
            : s
        );
      } catch {
        // ignore transient
      }
    };
    const onErr = (err) => {
      console.warn("GPS error", err);
      toast.error("Location permission denied. Enable GPS to broadcast.");
    };
    watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    });
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [session?.is_live]);

  const goLive = async () => {
    if (!selectedVehicle || !selectedRoute) {
      toast.error("Select vehicle and route first");
      return;
    }
    try {
      const { data } = await api.post("/driver/go-live", {
        vehicle_id: selectedVehicle,
        route_id: selectedRoute,
      });
      setSession(data);
      toast.success("You are LIVE. GPS broadcasting.");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const goOffline = async () => {
    try {
      await api.post("/driver/go-offline");
      setSession(null);
      toast.success("You are offline");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const onlineTime = session?.started_at
    ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
    : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[#00f0ff] text-xs uppercase tracking-[0.3em]">
            // driver portal
          </div>
          <h1 className="font-display font-black text-4xl md:text-6xl tracking-tighter mt-2">
            Hey, {user?.name?.split(" ")[0] || "Driver"}.
          </h1>
          {user?.status === "pending" && (
            <div className="mt-3 text-xs text-[#ffb800] border border-[#ffb800]/40 px-3 py-1 inline-block">
              Account pending admin approval
            </div>
          )}
        </div>
      </div>

      {/* Go Live card */}
      <div className="mt-10 border border-[#27272a] bg-[#141417] p-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
              Vehicle
            </div>
            <select
              data-testid="driver-vehicle-select"
              disabled={!!session}
              value={session?.vehicle_id || selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full mt-2 px-4 py-3 bg-[#0b0b0e] border border-[#27272a] outline-none"
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} — {v.vehicle_type}
                </option>
              ))}
            </select>
            <button
              data-testid="add-vehicle-btn"
              onClick={() => setShowAddVehicle(true)}
              className="mt-2 text-xs text-[#00f0ff] inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Register new vehicle
            </button>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
              Route
            </div>
            <select
              data-testid="driver-route-select"
              disabled={!!session}
              value={session?.route_id || selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full mt-2 px-4 py-3 bg-[#0b0b0e] border border-[#27272a] outline-none"
            >
              <option value="">Select route</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              data-testid="add-route-btn"
              onClick={() => setShowAddRoute(true)}
              className="mt-2 text-xs text-[#00f0ff] inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Request new route
            </button>
          </div>
          <div className="flex items-center justify-center">
            {!session ? (
              <button
                data-testid="go-live-btn"
                onClick={goLive}
                className="w-full h-full min-h-[100px] bg-[#ff0055] text-black font-display font-black text-3xl tracking-tighter hover:bg-white transition-colors relative"
              >
                <div className="absolute inset-4 border border-black/40" />
                GO LIVE
                <Radio className="w-5 h-5 inline ml-2" />
              </button>
            ) : (
              <button
                data-testid="go-offline-btn"
                onClick={goOffline}
                className="w-full h-full min-h-[100px] bg-[#141417] border border-[#ff0055] text-[#ff0055] font-display font-black text-3xl tracking-tighter hover:bg-[#ff0055] hover:text-black transition-colors relative"
              >
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff0055] opacity-75 live-ring" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff0055]" />
                </span>
                GO OFFLINE
                <OfflineIcon className="w-5 h-5 inline ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="mt-6 grid md:grid-cols-4 gap-4">
        <Metric
          label="Status"
          value={session ? "LIVE" : "OFFLINE"}
          color={session ? "#ff0055" : "#a1a1aa"}
          testid="stat-status"
        />
        <Metric
          label="Speed"
          value={session ? `${Math.round(session.speed || 0)} km/h` : "—"}
          testid="stat-speed"
        />
        <Metric
          label="Distance"
          value={session ? `${(session.distance_km || 0).toFixed(2)} km` : "—"}
          testid="stat-distance"
        />
        <Metric
          label="Online Time"
          value={session ? formatDuration(onlineTime) : "—"}
          testid="stat-online-time"
        />
      </div>

      {/* Live GPS map */}
      {session && session.latitude && (
        <div className="mt-6 border border-[#27272a] h-[400px]">
          <LiveMap
            vehicles={[session]}
            center={[session.latitude, session.longitude]}
            height="400px"
          />
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <AddVehicleModal
          onClose={() => setShowAddVehicle(false)}
          onSaved={loadAll}
        />
      )}
      {showAddRoute && (
        <AddRouteModal
          onClose={() => setShowAddRoute(false)}
          onSaved={loadAll}
        />
      )}
    </div>
  );
}

function Metric({ label, value, color, testid }) {
  return (
    <div className="border border-[#27272a] bg-[#141417] p-5" data-testid={testid}>
      <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
        {label}
      </div>
      <div
        className="mt-2 font-display font-black text-2xl tracking-tighter"
        style={{ color: color || "#ffffff" }}
      >
        {value}
      </div>
    </div>
  );
}

function formatDuration(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec
    .toString()
    .padStart(2, "0")}`;
}

function AddVehicleModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    vehicle_type: "Bus",
    vehicle_number: "",
    vehicle_name: "",
    capacity: 20,
    color: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/vehicles", { ...form, capacity: Number(form.capacity) || null });
      toast.success("Vehicle added (pending admin approval)");
      onSaved();
      onClose();
    } catch (e2) {
      setError(formatApiError(e2.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Register new vehicle">
      <form onSubmit={submit} className="space-y-4" data-testid="add-vehicle-form">
        <Select
          label="Type"
          testid="vehicle-type-select"
          value={form.vehicle_type}
          onChange={(v) => setForm({ ...form, vehicle_type: v })}
          options={["Bus", "Magic", "Auto", "Van", "Mini Bus", "Other"]}
        />
        <Input
          label="Vehicle Number"
          testid="vehicle-number-input"
          required
          value={form.vehicle_number}
          onChange={(v) => setForm({ ...form, vehicle_number: v.toUpperCase() })}
          placeholder="UP14AB1234"
        />
        <Input
          label="Vehicle Name"
          testid="vehicle-name-input"
          value={form.vehicle_name}
          onChange={(v) => setForm({ ...form, vehicle_name: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Capacity"
            testid="vehicle-capacity-input"
            type="number"
            value={form.capacity}
            onChange={(v) => setForm({ ...form, capacity: v })}
          />
          <Input
            label="Color"
            testid="vehicle-color-input"
            value={form.color}
            onChange={(v) => setForm({ ...form, color: v })}
          />
        </div>
        {error && <div className="text-sm text-[#ff0055]">{error}</div>}
        <button
          data-testid="submit-vehicle-btn"
          disabled={loading}
          className="w-full py-3 bg-[#ff0055] text-black font-medium hover:bg-white transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Register vehicle"}
        </button>
      </form>
    </Modal>
  );
}

function AddRouteModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    origin: "",
    destination: "",
    city: "",
    stops: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const stops = form.stops
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await api.post("/routes", { ...form, stops });
      toast.success("Route requested (pending admin approval)");
      onSaved();
      onClose();
    } catch (e2) {
      setError(formatApiError(e2.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Request new route">
      <form onSubmit={submit} className="space-y-4" data-testid="add-route-form">
        <Input
          label="Route Name"
          testid="route-name-input"
          required
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="Delhi → Ghaziabad"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Origin"
            testid="route-origin-input"
            required
            value={form.origin}
            onChange={(v) => setForm({ ...form, origin: v })}
          />
          <Input
            label="Destination"
            testid="route-destination-input"
            required
            value={form.destination}
            onChange={(v) => setForm({ ...form, destination: v })}
          />
        </div>
        <Input
          label="City / Region"
          testid="route-city-input"
          value={form.city}
          onChange={(v) => setForm({ ...form, city: v })}
        />
        <Input
          label="Stops (comma separated)"
          testid="route-stops-input"
          value={form.stops}
          onChange={(v) => setForm({ ...form, stops: v })}
          placeholder="Sahibabad, Vaishali, Indirapuram"
        />
        {error && <div className="text-sm text-[#ff0055]">{error}</div>}
        <button
          data-testid="submit-route-btn"
          disabled={loading}
          className="w-full py-3 bg-[#ff0055] text-black font-medium hover:bg-white transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Request route"}
        </button>
      </form>
    </Modal>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#141417] border border-[#27272a] w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-xl tracking-tight">{title}</h3>
          <button data-testid="modal-close-btn" onClick={onClose} className="text-[#a1a1aa] hover:text-white">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, testid, value, onChange, ...rest }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-[#a1a1aa]">
        {label}
      </label>
      <input
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 px-4 py-3 bg-[#0b0b0e] border border-[#27272a] focus:border-[#00f0ff] outline-none"
        {...rest}
      />
    </div>
  );
}

function Select({ label, testid, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-[#a1a1aa]">
        {label}
      </label>
      <select
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 px-4 py-3 bg-[#0b0b0e] border border-[#27272a] focus:border-[#00f0ff] outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
