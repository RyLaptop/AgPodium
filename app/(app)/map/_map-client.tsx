"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type MapMeeting = {
  id: string;
  title: string;
  org_name: string;
  org_slug: string;
  location: string | null;
  starts_at: string;
  lat: number | null;
  lng: number | null;
};

// Known TAMU building coordinates
const TAMU_BUILDINGS: Record<string, [number, number]> = {
  msc: [30.6117, -96.3408],
  rudder: [30.6117, -96.3408],
  "rudder theatre": [30.6117, -96.3408],
  "rudder tower": [30.6117, -96.3408],
  "koldus": [30.6190, -96.3375],
  "zachry": [30.6198, -96.3358],
  "zach": [30.6198, -96.3358],
  "blocker": [30.6191, -96.3385],
  "sbisa": [30.6123, -96.3432],
  "rec": [30.6075, -96.3460],
  "white creek": [30.5983, -96.3410],
  "olsen": [30.6106, -96.3442],
  "kyle": [30.6109, -96.3370],
  "reed arena": [30.6099, -96.3425],
  "teague": [30.6193, -96.3330],
  "eaba": [30.6150, -96.3400],
  "annex": [30.6175, -96.3395],
};

function geocodeLocal(location: string): [number, number] | null {
  const lower = location.toLowerCase();
  for (const [key, coords] of Object.entries(TAMU_BUILDINGS)) {
    if (lower.includes(key)) return coords;
  }
  return null;
}

const TAMU_CENTER: [number, number] = [30.6187, -96.3365];

export function MapClient({ meetings }: { meetings: MapMeeting[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically load Leaflet
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView(TAMU_CENTER, 15);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Group meetings by location
      const byLocation = new Map<string, MapMeeting[]>();
      for (const m of meetings) {
        const key = m.location ?? "__unknown__";
        if (!byLocation.has(key)) byLocation.set(key, []);
        byLocation.get(key)!.push(m);
      }

      let i = 0;
      for (const [loc, items] of byLocation.entries()) {
        const known = loc !== "__unknown__" ? geocodeLocal(loc) : null;
        // Slight jitter for unknown locations so markers don't stack exactly
        const lat = known?.[0] ?? (TAMU_CENTER[0] + (i % 5) * 0.0015 - 0.003);
        const lng = known?.[1] ?? (TAMU_CENTER[1] + Math.floor(i / 5) * 0.0015 - 0.003);
        i++;

        const popupContent = items.map((m) =>
          `<div style="margin-bottom:6px"><b>${m.org_name}</b><br>${m.title}<br>
           <span style="color:#888;font-size:11px">${new Date(m.starts_at).toLocaleString()}</span><br>
           <span style="color:#888;font-size:11px">${loc !== "__unknown__" ? loc : "Location TBD"}</span></div>`
        ).join("<hr style='border:none;border-top:1px solid #eee;margin:4px 0'/>");

        const mapsUrl = loc !== "__unknown__"
          ? `https://maps.google.com/?q=${encodeURIComponent(loc + " Texas A&M University")}`
          : `https://maps.google.com/?q=Texas+A%26M+University`;

        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(
            `<div style="min-width:180px">${popupContent}
             <a href="${mapsUrl}" target="_blank" style="color:#500000;font-size:12px">Open in Google Maps →</a></div>`
          );
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [meetings]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: 400 }} />;
}
