import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

const busIcon = L.divIcon({
  className: "bus-marker",
  html: '<div class="bus-dot"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Naye routes banane ke liye pin icon
const pinIcon = L.divIcon({
  className: "pin-marker",
  html: '<div style="background-color: #00f0ff; width: 12px; height: 12px; rounded-circle: 50%; border: 2px solid white; border-radius: 50%;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom() || 12, { animate: true });
  }, [center, map]);
  return null;
}

// Map clicks ko handle karne aur points save karne ke liye helper component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function LiveMap({ vehicles = [], center = [28.6692, 77.4538], onVehicleClick, height = "100%", isEditMode = true }) {
  const [customRoutePoints, setCustomRoutePoints] = useState([]);

  const handleMapClick = (newPoint) => {
    if (!isEditMode) return;
    
    const updatedPoints = [...customRoutePoints, newPoint];
    setCustomRoutePoints(updatedPoints);
    
    // Aapke console mein Rapido jaisa exact lat-long mil jayega naya route backend mein jodne ke liye
    console.log("Sahi Pin-point Route coordinates:", JSON.stringify(updatedPoints));
  };

  const clearRoute = () => {
    setCustomRoutePoints([]);
  };

  return (
    <div style={{ height, width: "100%", position: "relative" }} data-testid="live-map">
      
      {/* Clear Button */}
      {isEditMode && customRoutePoints.length > 0 && (
        <button 
          onClick={clearRoute}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, background: "#ff0055", color: "black", padding: "6px 12px", fontWeight: "bold", border: "none", cursor: "pointer" }}
        >
          Reset Route
        </button>
      )}

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

        {/* Live Vehicles */}
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

        {/* Rapido Jaisa Custom Route Drawing */}
        {isEditMode && (
          <>
            <MapClickHandler onMapClick={handleMapClick} />
            {customRoutePoints.map((point, index) => (
              <Marker key={index} position={point} icon={pinIcon} />
            ))}
            {customRoutePoints.length > 1 && (
              <Polyline positions={customRoutePoints} color="#00f0ff" weight={4} dashArray="5, 10" />
            )}
          </>
        )}

        {center && <Recenter center={center} />}
      </MapContainer>
    </div>
  );
}
