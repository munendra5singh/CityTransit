import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const busIcon = L.divIcon({
  className: "bus-marker",
  html: '<div class="bus-dot"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom() || 12, { animate: true });
  }, [center, map]);
  return null;
}

export default function LiveMap({ vehicles = [], center = [28.6692, 77.4538], onVehicleClick, height = "100%" }) {
  return (
    <div style={{ height, width: "100%" }} data-testid="live-map">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {vehicles.map((v) => (
          <Marker
            key={v.vehicle_id}
            position={[v.latitude, v.longitude]}
            icon={busIcon}
            eventHandlers={{
              click: () => onVehicleClick && onVehicleClick(v),
            }}
          >
            <Popup>
              <div className="font-body text-sm">
                <div className="font-display text-base font-bold">{v.vehicle_number}</div>
                <div className="text-xs text-[#a1a1aa] uppercase tracking-widest">
                  {v.vehicle_type}
                </div>
                <div className="mt-2 text-xs">
                  Route: <span className="text-[#00f0ff]">{v.route_name}</span>
                </div>
                <div className="text-xs">Driver: {v.driver_name}</div>
                <div className="text-xs">
                  Speed: {Math.round(v.speed || 0)} km/h
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {center && <Recenter center={center} />}
      </MapContainer>
    </div>
  );
}
