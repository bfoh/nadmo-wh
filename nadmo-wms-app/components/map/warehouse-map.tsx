'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export type MapWarehouse = {
  id: string;
  name: string;
  code: string;
  type: 'hq' | 'regional' | 'district' | string;
  region: string | null;
  lat: number;
  lng: number;
  available: number;
  capacityPct: number | null;
};

// Stock → colour (zero = red, low = amber, healthy = green). Shape/letter = type.
export function stockColor(available: number) {
  if (available <= 0) return '#E74C3C';
  if (available < 500) return '#F5A623';
  return '#0F6B3D';
}

function typeMeta(type: string) {
  if (type === 'hq') return { letter: '★', size: 34 };
  if (type === 'regional') return { letter: 'R', size: 28 };
  return { letter: 'D', size: 22 };
}

function pinIcon(type: string, color: string) {
  const { letter, size } = typeMeta(type);
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${Math.round(
      size * 0.42
    )}px;box-shadow:0 1px 5px rgba(0,0,0,.45)">${letter}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Fit the view to the visible markers whenever the set changes.
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
}

const TYPE_LABEL: Record<string, string> = { hq: 'HQ', regional: 'Regional', district: 'District' };

export function WarehouseMap({ warehouses }: { warehouses: MapWarehouse[] }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  const tileUrl = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const points = warehouses.map((w) => [w.lat, w.lng] as [number, number]);

  return (
    <MapContainer
      center={[7.95, -1.03]}
      zoom={7}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: dark ? '#0b0f14' : '#e8edf1' }}
    >
      <TileLayer
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url={tileUrl}
      />
      <FitBounds points={points} />
      {warehouses.map((w) => (
        <Marker key={w.id} position={[w.lat, w.lng]} icon={pinIcon(w.type, stockColor(w.available))}>
          <Popup>
            <div className="min-w-[180px] font-sans">
              <div className="text-sm font-semibold text-[#161616]">{w.name}</div>
              <div className="font-mono text-[11px] text-[#6b7280]">{w.code}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wide text-[#6b7280]">
                {TYPE_LABEL[w.type] ?? w.type}
                {w.region ? ` · ${w.region}` : ''}
              </div>
              <div className="mt-2 flex items-center justify-between gap-4 border-t border-[#e5e7eb] pt-2 text-xs">
                <span className="text-[#6b7280]">Available</span>
                <span className="font-semibold text-[#161616]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {w.available.toLocaleString()}
                </span>
              </div>
              {w.capacityPct != null && (
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-[#6b7280]">Capacity used</span>
                  <span className="font-medium text-[#161616]">{w.capacityPct}%</span>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
