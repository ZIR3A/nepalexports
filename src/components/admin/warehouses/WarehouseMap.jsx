"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue in Next.js/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        const wrapped = e.latlng.wrap();
        onLocationSelect([wrapped.lat, wrapped.lng]);
      }
    }
  });
  return null;
}

export default function WarehouseMap({ warehouses = [], selectedLocation, geofenceRadius = 50, onLocationSelect }) {
  const defaultCenter = [51.505, -0.09]; // London fallback
  
  return (
    <div className="h-[400px] w-full rounded-md border border-border overflow-hidden relative z-0">
      <MapContainer center={defaultCenter} zoom={3} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {warehouses.map(w => {
          if (!w.address?.coordinates?.coordinates || w.address.coordinates.coordinates.length !== 2) return null;
          const [lng, lat] = w.address.coordinates.coordinates;
          return (
            <div key={w._id}>
              <Marker position={[lat, lng]}>
                <Popup>
                  <strong>{w.name}</strong><br />
                  Code: {w.code}<br />
                  Status: {w.status}
                </Popup>
              </Marker>
              <Circle center={[lat, lng]} radius={(w.geofenceRadiusKM || 50) * 1000} pathOptions={{ color: w.status === 'Active' ? 'green' : 'gray', fillColor: w.status === 'Active' ? 'green' : 'gray', fillOpacity: 0.1 }} />
            </div>
          );
        })}

        {selectedLocation && (
          <>
            <Marker position={selectedLocation}>
              <Popup>Selected Location</Popup>
            </Marker>
            <Circle center={selectedLocation} radius={geofenceRadius * 1000} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }} />
          </>
        )}

        {onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}
      </MapContainer>
    </div>
  );
}
