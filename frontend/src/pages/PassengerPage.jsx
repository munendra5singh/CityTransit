import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/apiClient";
import LiveMap from "@/components/LiveMap";
import { Search, Phone, Info, MapPin, Zap, Star, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PassengerPage() {
  const [params, setParams] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(params.get("route") || "");
  const [vehicles, setVehicles] = useState([]);
  const [query, setQuery] = useState(params.get("q") || "");
  const [info, setInfo] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ct_favs") || "[]");
    } catch {
      return [];
    }
  });
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ct_recent") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    api.get("/routes").then((r) => setRoutes(r.data));
  }, []);

  // Poll live vehicles
  useEffect(() => {
    let timer;
    const fetchLive = async () => {
      try {
        const p = {};
        if (selectedRoute) p.route_id = selectedRoute;
        if (query.trim()) p.vehicle_number = query.trim();
        const { data } = await api.get("/live/vehicles", { params: p });
        setVehicles(data);
      } catch {
        // ignore
      }
    };
    fetchLive();
    timer = setInterval(fetchLive, 4000);
    return () => clearInterval(timer);
  }, [selectedRoute, query]);

  const center = useMemo(() => {
    if (vehicles.length > 0) return [vehicles[0].latitude, vehicles[0].longitude];
    return [28.6692, 77.4538];
  }, [vehicles]);

  const doSearch = (e) => {
    e && e.preventDefault();
    if (query.trim()) {
      const next = [query.trim(), ...recent.filter((r) => r !== query.trim())].slice(0, 5);
      setRecent(next);
      localStorage.setItem("ct_recent", JSON.stringify(next));
    }
  };

  const toggleFav = (routeId) => {
    let next;
    if (favorites.includes(routeId)) next = favorites.filter((r) => r !== routeId);
    else next = [...favorites, routeId];
    setFavorites(next);
    localStorage.setItem("ct_favs", JSON.stringify(next));
  };

  const applyRoute = (routeId) => {
    setSelectedRoute(routeId);
    setParams(routeId ? { route: routeId } : {});
  };

  return (
    <div className="relative h-[calc(100vh-72px)] w-full overflow-hidden">
      {/* Map layer */}
      <div className="absolute inset-0">
        <LiveMap
          vehicles={vehicles}
          center={center}
          onVehicleClick={(v) => setInfo(v)}
        />
      </div>

      {/* Top search */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[min(700px,92%)] z-30">
        <form
          onSubmit={doSearch}
          className="glass border border-[#27272a] flex items-stretch"
        >
          <div className="pl-4 flex items-center text-[#a1a1aa]">
            <Search className="w-4 h-4" />
          </div>
          <input
            data-testid="passenger-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Vehicle number e.g. UP14AB1234"
            className="flex-1 bg-transparent px-3 py-3 outline-none text-sm placeholder:text-[#52525b]"
          />
          <button
            data-testid="passenger-search-btn"
            type="submit"
            className="px-5 bg-[#ff0055] text-black text-sm font-medium hover:bg-white transition-colors"
          >
            Track
          </button>
        </form>
        {recent.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#a1a1aa] pt-1">
              Recent:
            </span>
            {recent.map((r) => (
              <button
                key={r}
                data-testid={`recent-${r}`}
                onClick={() => {
                  setQuery(r);
                }}
                className="text-xs px-2 py-1 bg-[#141417]/80 border border-[#27272a] hover:border-[#00f0ff]"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Left panel: routes */}
      <div className="absolute left-4 top-24 bottom-4 w-[320px] hidden lg:flex flex-col gap-3 z-20">
        <div className="glass border border-[#27272a] p-4">
          <div className="text-[10px] uppercase tracking-widest text-[#00f0ff]">
            // routes
          </div>
          <h3 className="mt-1 font-display font-bold text-xl">Pick a route</h3>
          <button
            data-testid="clear-route-btn"
            onClick={() => applyRoute("")}
            className={`mt-3 w-full text-left px-3 py-2 text-xs border ${
              !selectedRoute
                ? "border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]"
                : "border-[#27272a] hover:border-[#27272a]"
            }`}
          >
            All Live Vehicles
          </button>
        </div>
        <div className="glass border border-[#27272a] flex-1 overflow-y-auto p-3 space-y-2">
          {routes.map((r) => (
            <div
              key={r.id}
              className={`p-3 border transition-colors cursor-pointer ${
                selectedRoute === r.id
                  ? "border-[#ff0055] bg-[#ff0055]/10"
                  : "border-[#27272a] hover:border-[#00f0ff]"
              }`}
              onClick={() => applyRoute(r.id)}
              data-testid={`select-route-${r.id}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
                    {r.city || "India"}
                  </div>
                  <div className="font-display font-bold text-sm mt-0.5">
                    {r.name}
                  </div>
                </div>
                <button
                  data-testid={`fav-${r.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(r.id);
                    toast.success(
                      favorites.includes(r.id)
                        ? "Removed from favorites"
                        : "Saved to favorites"
                    );
                  }}
                >
                  <Star
                    className={`w-4 h-4 ${
                      favorites.includes(r.id)
                        ? "fill-[#ffb800] text-[#ffb800]"
                        : "text-[#52525b]"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom panel: live vehicles */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="glass border-t border-[#27272a] px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff0055] opacity-75 live-ring" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff0055]" />
              </span>
              <span className="text-xs uppercase tracking-widest text-[#a1a1aa]">
                {vehicles.length} live vehicles
              </span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {vehicles.length === 0 && (
              <div
                data-testid="no-live-vehicles"
                className="text-sm text-[#a1a1aa] py-6"
              >
                No live vehicles right now.
                {selectedRoute
                  ? " Try a different route."
                  : " Ask a driver to go live!"}
              </div>
            )}
            {vehicles.map((v) => (
              <VehicleCard
                key={v.vehicle_id}
                v={v}
                onInfo={() => setInfo(v)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Info dialog */}
      <Dialog open={!!info} onOpenChange={(o) => !o && setInfo(null)}>
        <DialogContent
          className="bg-[#141417] border-[#27272a] text-white max-w-md"
          data-testid="vehicle-info-dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-black text-2xl tracking-tighter">
              {info?.vehicle_number}
            </DialogTitle>
            <DialogDescription className="text-[#a1a1aa]">
              {info?.vehicle_type} · {info?.route_name}
            </DialogDescription>
          </DialogHeader>
          {info && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
                    Speed
                  </div>
                  <div className="font-display font-black text-xl">
                    {Math.round(info.speed || 0)}
                    <span className="text-xs text-[#a1a1aa] ml-1">km/h</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
                    Distance
                  </div>
                  <div className="font-display font-black text-xl">
                    {(info.distance_km || 0).toFixed(1)}
                    <span className="text-xs text-[#a1a1aa] ml-1">km</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
                    Status
                  </div>
                  <div className="text-[#00f0ff] font-medium text-sm mt-1">
                    LIVE
                  </div>
                </div>
              </div>
              <div className="text-sm space-y-1 border-t border-[#27272a] pt-4">
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Driver</span>
                  <span>{info.driver_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Route</span>
                  <span>
                    {info.route_origin} → {info.route_destination}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Last updated</span>
                  <span>{timeAgo(info.last_update)}</span>
                </div>
              </div>
              {info.driver_mobile && (
                <a
                  href={`tel:${info.driver_mobile}`}
                  data-testid="call-driver-btn"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#ff0055] text-black font-medium hover:bg-white transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Driver
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleCard({ v, onInfo }) {
  return (
    <div
      data-testid={`vehicle-card-${v.vehicle_id}`}
      className="min-w-[260px] bg-[#141417] border border-[#27272a] p-4 hover:border-[#ff0055] transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-[#00f0ff]">
          {v.vehicle_type}
        </div>
        <button
          data-testid={`info-btn-${v.vehicle_id}`}
          onClick={onInfo}
          className="p-1 hover:bg-[#27272a]"
          aria-label="Info"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-2 font-display font-black text-xl tracking-tighter">
        {v.vehicle_number}
      </div>
      <div className="text-xs text-[#a1a1aa]">{v.driver_name}</div>
      <div className="mt-3 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-[#00f0ff]">
          <Zap className="w-3 h-3" /> {Math.round(v.speed || 0)} km/h
        </div>
        <div className="flex items-center gap-1 text-[#a1a1aa]">
          <Clock className="w-3 h-3" /> {timeAgo(v.last_update)}
        </div>
      </div>
      <div className="mt-2 text-xs text-[#a1a1aa] truncate">
        <MapPin className="w-3 h-3 inline mr-1" />
        {v.route_name}
      </div>
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return "-";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
