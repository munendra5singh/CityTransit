import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import LiveMap from "@/components/LiveMap";
import { toast } from "sonner";
import { Users, Truck, Route as RouteIcon, Radio, ShieldCheck, Trash2, CheckCircle2, XCircle } from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "drivers", label: "Drivers" },
  { id: "vehicles", label: "Vehicles" },
  { id: "routes", label: "Routes" },
  { id: "users", label: "Users" },
  { id: "live", label: "Live Map" },
  { id: "reports", label: "Reports" },
];

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="text-[#00f0ff] text-xs uppercase tracking-[0.3em]">
        // admin console
      </div>
      <h1 className="font-display font-black text-4xl md:text-6xl tracking-tighter mt-2">
        Mission control.
      </h1>

      <div className="mt-8 flex flex-wrap gap-1 border-b border-[#27272a]">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-testid={`admin-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-[#ff0055] text-white"
                : "border-transparent text-[#a1a1aa] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "drivers" && <DriversTab />}
        {tab === "vehicles" && <VehiclesTab />}
        {tab === "routes" && <RoutesTab />}
        {tab === "users" && <UsersTab />}
        {tab === "live" && <LiveTab />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data));
  }, []);
  if (!stats) return <div className="text-[#a1a1aa]">Loading stats...</div>;
  const cards = [
    { label: "Total Drivers", value: stats.total_drivers, icon: Users, color: "#00f0ff" },
    { label: "Total Vehicles", value: stats.total_vehicles, icon: Truck, color: "#00f0ff" },
    { label: "Total Routes", value: stats.total_routes, icon: RouteIcon, color: "#00f0ff" },
    { label: "Passenger Users", value: stats.total_users, icon: Users, color: "#00f0ff" },
    { label: "Live Vehicles", value: stats.live_vehicles, icon: Radio, color: "#ff0055" },
    { label: "Pending Drivers", value: stats.pending_drivers, icon: ShieldCheck, color: "#ffb800" },
    { label: "Pending Vehicles", value: stats.pending_vehicles, icon: Truck, color: "#ffb800" },
    { label: "Pending Routes", value: stats.pending_routes, icon: RouteIcon, color: "#ffb800" },
  ];
  return (
    <div className="grid md:grid-cols-4 gap-4" data-testid="admin-stats-grid">
      {cards.map((c) => (
        <div
          key={c.label}
          className="border border-[#27272a] bg-[#141417] p-6"
          data-testid={`stat-${c.label.toLowerCase().replace(/ /g, "-")}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
              {c.label}
            </span>
            <c.icon className="w-4 h-4" style={{ color: c.color }} />
          </div>
          <div
            className="mt-4 font-display font-black text-4xl tracking-tighter"
            style={{ color: c.color }}
          >
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function DriversTab() {
  const [drivers, setDrivers] = useState([]);
  const load = () =>
    api.get("/admin/drivers").then((r) => setDrivers(r.data));
  useEffect(() => {
    load();
  }, []);
  const act = async (id, path, msg) => {
    try {
      if (path === "delete") await api.delete(`/admin/drivers/${id}`);
      else await api.post(`/admin/drivers/${id}/${path}`);
      toast.success(msg);
      load();
    } catch {
      toast.error("Action failed");
    }
  };
  return (
    <Table
      testid="drivers-table"
      headers={["Name", "Email", "Mobile", "Status", "Actions"]}
      rows={drivers.map((d) => [
        d.name,
        d.email,
        d.mobile || "—",
        <StatusBadge key="s" status={d.status} />,
        <RowActions key="a">
          {d.status !== "approved" && (
            <IconBtn
              testid={`approve-driver-${d.id}`}
              onClick={() => act(d.id, "approve", "Driver approved")}
              color="#00f0ff"
            >
              <CheckCircle2 className="w-4 h-4" />
            </IconBtn>
          )}
          {d.status !== "blocked" && (
            <IconBtn
              testid={`block-driver-${d.id}`}
              onClick={() => act(d.id, "block", "Driver blocked")}
              color="#ffb800"
            >
              <XCircle className="w-4 h-4" />
            </IconBtn>
          )}
          <IconBtn
            testid={`delete-driver-${d.id}`}
            onClick={() => act(d.id, "delete", "Driver deleted")}
            color="#ff0055"
          >
            <Trash2 className="w-4 h-4" />
          </IconBtn>
        </RowActions>,
      ])}
    />
  );
}

function VehiclesTab() {
  const [vehicles, setVehicles] = useState([]);
  const load = () => api.get("/admin/vehicles").then((r) => setVehicles(r.data));
  useEffect(() => {
    load();
  }, []);
  const approve = async (id) => {
    await api.post(`/admin/vehicles/${id}/approve`);
    toast.success("Vehicle approved");
    load();
  };
  const del = async (id) => {
    await api.delete(`/vehicles/${id}`);
    toast.success("Vehicle removed");
    load();
  };
  return (
    <Table
      testid="vehicles-table"
      headers={["Number", "Type", "Name", "Capacity", "Status", "Actions"]}
      rows={vehicles.map((v) => [
        v.vehicle_number,
        v.vehicle_type,
        v.vehicle_name || "—",
        v.capacity || "—",
        <StatusBadge key="s" status={v.status} />,
        <RowActions key="a">
          {v.status !== "approved" && (
            <IconBtn
              testid={`approve-vehicle-${v.id}`}
              onClick={() => approve(v.id)}
              color="#00f0ff"
            >
              <CheckCircle2 className="w-4 h-4" />
            </IconBtn>
          )}
          <IconBtn
            testid={`delete-vehicle-${v.id}`}
            onClick={() => del(v.id)}
            color="#ff0055"
          >
            <Trash2 className="w-4 h-4" />
          </IconBtn>
        </RowActions>,
      ])}
    />
  );
}

function RoutesTab() {
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ name: "", origin: "", destination: "", city: "", stops: "" });
  const load = () => api.get("/admin/routes").then((r) => setRoutes(r.data));
  useEffect(() => {
    load();
  }, []);
  const add = async (e) => {
    e.preventDefault();
    const stops = form.stops.split(",").map((s) => s.trim()).filter(Boolean);
    await api.post("/routes", { ...form, stops });
    toast.success("Route created");
    setForm({ name: "", origin: "", destination: "", city: "", stops: "" });
    load();
  };
  const approve = async (id) => {
    await api.post(`/routes/${id}/approve`);
    toast.success("Route approved");
    load();
  };
  const del = async (id) => {
    await api.delete(`/routes/${id}`);
    toast.success("Route deleted");
    load();
  };
  return (
    <div className="space-y-6">
      <form
        onSubmit={add}
        data-testid="admin-add-route-form"
        className="grid md:grid-cols-5 gap-3 bg-[#141417] border border-[#27272a] p-4"
      >
        <input
          data-testid="admin-route-name"
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 bg-[#0b0b0e] border border-[#27272a] outline-none"
        />
        <input
          data-testid="admin-route-origin"
          required
          placeholder="Origin"
          value={form.origin}
          onChange={(e) => setForm({ ...form, origin: e.target.value })}
          className="px-3 py-2 bg-[#0b0b0e] border border-[#27272a] outline-none"
        />
        <input
          data-testid="admin-route-destination"
          required
          placeholder="Destination"
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
          className="px-3 py-2 bg-[#0b0b0e] border border-[#27272a] outline-none"
        />
        <input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="px-3 py-2 bg-[#0b0b0e] border border-[#27272a] outline-none"
        />
        <button
          data-testid="admin-add-route-btn"
          type="submit"
          className="px-3 py-2 bg-[#ff0055] text-black hover:bg-white transition-colors"
        >
          Add route
        </button>
      </form>
      <Table
        testid="routes-table"
        headers={["Name", "Origin", "Destination", "City", "Status", "Actions"]}
        rows={routes.map((r) => [
          r.name,
          r.origin,
          r.destination,
          r.city || "—",
          <StatusBadge key="s" status={r.status} />,
          <RowActions key="a">
            {r.status !== "approved" && (
              <IconBtn
                testid={`approve-route-${r.id}`}
                onClick={() => approve(r.id)}
                color="#00f0ff"
              >
                <CheckCircle2 className="w-4 h-4" />
              </IconBtn>
            )}
            <IconBtn
              testid={`delete-route-${r.id}`}
              onClick={() => del(r.id)}
              color="#ff0055"
            >
              <Trash2 className="w-4 h-4" />
            </IconBtn>
          </RowActions>,
        ])}
      />
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    api.get("/admin/users").then((r) => setUsers(r.data));
  }, []);
  return (
    <Table
      testid="users-table"
      headers={["Name", "Email", "Mobile", "Joined"]}
      rows={users.map((u) => [
        u.name,
        u.email,
        u.mobile || "—",
        new Date(u.created_at).toLocaleDateString(),
      ])}
    />
  );
}

function LiveTab() {
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => {
    const load = () => api.get("/live/vehicles").then((r) => setVehicles(r.data));
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);
  const center =
    vehicles.length > 0
      ? [vehicles[0].latitude, vehicles[0].longitude]
      : [28.6692, 77.4538];
  return (
    <div className="border border-[#27272a] h-[600px]" data-testid="admin-live-map">
      <LiveMap vehicles={vehicles} center={center} height="600px" />
    </div>
  );
}

function ReportsTab() {
  const [rep, setRep] = useState(null);
  useEffect(() => {
    api.get("/admin/reports").then((r) => setRep(r.data));
  }, []);
  if (!rep) return <div className="text-[#a1a1aa]">Loading...</div>;
  return (
    <div className="grid md:grid-cols-3 gap-4" data-testid="admin-reports-grid">
      <div className="border border-[#27272a] bg-[#141417] p-6">
        <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
          Total trips
        </div>
        <div className="mt-3 font-display font-black text-4xl tracking-tighter">
          {rep.total_trips}
        </div>
      </div>
      <div className="border border-[#27272a] bg-[#141417] p-6">
        <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
          Trips in last 24h
        </div>
        <div className="mt-3 font-display font-black text-4xl tracking-tighter text-[#ff0055]">
          {rep.daily_trips}
        </div>
      </div>
      <div className="border border-[#27272a] bg-[#141417] p-6">
        <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
          Total distance
        </div>
        <div className="mt-3 font-display font-black text-4xl tracking-tighter text-[#00f0ff]">
          {rep.total_distance_km}
          <span className="text-sm text-[#a1a1aa] ml-2">km</span>
        </div>
      </div>
    </div>
  );
}

// Helpers
function Table({ headers, rows, testid }) {
  return (
    <div
      className="border border-[#27272a] bg-[#141417] overflow-x-auto"
      data-testid={testid}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#27272a] text-left">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-[10px] uppercase tracking-widest text-[#a1a1aa] font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={headers.length}
                className="text-center py-8 text-[#a1a1aa] text-sm"
              >
                No data
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[#27272a] hover:bg-[#0b0b0e]">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3 text-sm">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const c =
    status === "approved"
      ? "#00f0ff"
      : status === "blocked"
      ? "#ff0055"
      : "#ffb800";
  return (
    <span
      className="text-[10px] uppercase tracking-widest px-2 py-1 border"
      style={{ color: c, borderColor: c + "66" }}
    >
      {status}
    </span>
  );
}

function RowActions({ children }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

function IconBtn({ children, onClick, color, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className="p-1.5 border transition-colors"
      style={{ borderColor: color + "66", color }}
    >
      {children}
    </button>
  );
}
