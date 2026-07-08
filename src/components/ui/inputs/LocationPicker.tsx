import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

// Vite/webpack break Leaflet's default icon URLs — reset them manually
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (lat: number, lng: number) => void;
}

// Default center if nothing is set yet — Tripoli, adjust if your projects
// are usually elsewhere
const DEFAULT_CENTER: [number, number] = [32.8872, 13.1913];

function ClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMapEvents({});
  const didInit = useRef(false);

  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const hasPosition =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const position: [number, number] = hasPosition
    ? [latitude as number, longitude as number]
    : DEFAULT_CENTER;

  return (
    <div className="md:col-span-2">
      <label className="mb-1 text-sm text-foreground block">
        الموقع على الخريطة (اضغط لتحديد الموقع)
      </label>
      <div
        className="rounded overflow-hidden border isolate"
        style={{ height: 300 }}
      >
        <MapContainer
          center={position}
          zoom={hasPosition ? 15 : 6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPosition && <Marker position={position} icon={defaultIcon} />}
          <ClickHandler onChange={onChange} />
          {hasPosition && (
            <RecenterOnChange lat={position[0]} lng={position[1]} />
          )}
        </MapContainer>
      </div>
      {hasPosition && (
        <p className="text-xs text-gray-500 mt-1">
          {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </p>
      )}
    </div>
  );
}
