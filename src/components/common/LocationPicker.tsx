"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Crosshair } from "lucide-react";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const DEFAULT_CENTER: [number, number] = [32.8872, 13.1913];
const DEFAULT_ZOOM = 12;
const PICKED_ZOOM = 16;

type LatLng = { lat: number; lng: number };

interface LocationPickerProps {
  value?: LatLng | null;
  onChange: (value: LatLng) => void;
  height?: number;
  hintText?: string;
  myLocationLabel?: string;
}

function ClickHandler({ onChange }: { onChange: (v: LatLng) => void }) {
  useMapEvents({
    click(e) { onChange({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return null;
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), PICKED_ZOOM), { duration: 0.6 });
  }, [position, map]);
  return null;
}

export default function LocationPicker({
  value,
  onChange,
  height = 280,
  hintText,
  myLocationLabel,
}: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  const initialCenter: [number, number] = useMemo(() => {
    if (value?.lat && value?.lng) return [value.lat, value.lng];
    return DEFAULT_CENTER;
  }, [value]);

  const markerPosition: [number, number] | null =
    value?.lat && value?.lng ? [value.lat, value.lng] : null;

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="overflow-hidden rounded-xl border border-gray-200"
        style={{ height, width: "100%" }}
      >
        <MapContainer
          center={initialCenter}
          zoom={markerPosition ? PICKED_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable
              ref={markerRef}
              eventHandlers={{
                dragend: () => {
                  const m = markerRef.current;
                  if (!m) return;
                  const p = m.getLatLng();
                  onChange({ lat: p.lat, lng: p.lng });
                },
              }}
            />
          )}
          <FlyTo position={markerPosition} />
        </MapContainer>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          {markerPosition && <MapPin size={12} />}
          {hintText}
          {markerPosition && `  ·  ${markerPosition[0].toFixed(5)}, ${markerPosition[1].toFixed(5)}`}
        </span>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition"
        >
          <Crosshair size={14} />
          {myLocationLabel}
        </button>
      </div>
    </div>
  );
}
