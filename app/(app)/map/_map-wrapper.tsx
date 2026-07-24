"use client";

import dynamic from "next/dynamic";

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

const MapClient = dynamic(
  () => import("./_map-client").then((m) => m.MapClient),
  { ssr: false, loading: () => <div className="w-full h-full rounded-xl bg-gray-100 animate-pulse" /> }
);

export function MapWrapper({ meetings }: { meetings: MapMeeting[] }) {
  return <MapClient meetings={meetings} />;
}
