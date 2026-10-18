'use client';

import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';

const pin = L.divIcon({
  html: '<svg viewBox="0 0 34 44" width="30" height="40" style="filter:drop-shadow(0 3px 3px rgba(0,0,0,.5))"><path d="M17 43S3 27 3 16a14 14 0 0 1 28 0c0 11-14 27-14 27z" fill="#e53935" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="16" r="6" fill="#fff"/></svg>',
  className: 'reef-pin',
  iconSize: [30, 40],
  iconAnchor: [15, 39],
});

const Clicker: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

const Follow: React.FC<{ lat: number | null; lng: number | null }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return;
    if (!map.getBounds().pad(-0.2).contains([lat, lng])) {
      map.setView([lat, lng], Math.max(map.getZoom(), 13), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
};

const LocationPicker: React.FC<{
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}> = ({ lat, lng, onChange }) => {
  const has = lat != null && lng != null;
  return (
    <MapContainer
      center={has ? [lat, lng] : [12.5, 122.0]}
      zoom={has ? 14 : 5}
      minZoom={5}
      scrollWheelZoom={false}
      className="h-full w-full rounded-3xl"
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Imagery &copy; Esri"
        maxZoom={19}
      />
      <Clicker onPick={onChange} />
      <Follow lat={lat} lng={lng} />
      {has && (
        <Marker
          position={[lat, lng]}
          icon={pin}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onChange(p.lat, p.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
};

export default LocationPicker;
