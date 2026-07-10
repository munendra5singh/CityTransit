import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { ChevronRight } from "lucide-react";

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  useEffect(() => {
    api.get("/routes").then((r) => setRoutes(r.data));
  }, []);
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="text-[#00f0ff] text-xs uppercase tracking-[0.3em]">
        // available routes
      </div>
      <h1 className="mt-2 font-display font-black text-5xl md:text-7xl tracking-tighter">
        All routes.
      </h1>
      <p className="mt-4 text-[#a1a1aa] max-w-2xl">
        Browse every approved route in the network. Tap one to see live vehicles
        moving on it right now.
      </p>

      <div className="mt-12 grid md:grid-cols-2 gap-4" data-testid="routes-grid">
        {routes.map((r) => (
          <Link
            key={r.id}
            to={`/passenger?route=${r.id}`}
            data-testid={`route-tile-${r.id}`}
            className="group block bg-[#141417] border border-[#27272a] p-6 hover:border-[#ff0055] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">
                  {r.city || "India"}
                </div>
                <div className="mt-2 font-display font-black text-2xl tracking-tighter">
                  {r.origin}{" "}
                  <span className="text-[#ff0055]">→ {r.destination}</span>
                </div>
                {r.stops?.length > 0 && (
                  <div className="mt-3 text-xs text-[#a1a1aa]">
                    Stops: {r.stops.join(" · ")}
                  </div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-[#a1a1aa] group-hover:text-[#00f0ff]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
