"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl } from "maplibre-gl";
import Map, { NavigationControl, type MapProps } from "react-map-gl/maplibre";
import { useStoopMapStyle } from "@/components/maps/stoop-style";

// Copied to /public by scripts/copy-maplibre-worker.mjs on install.
if (typeof window !== "undefined") setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

/** MapLibre map with Stoop's palette. Free OpenStreetMap tiles, no API key. */
export function StoopMap({
  children,
  zoomControl = true,
  ...props
}: Omit<MapProps, "mapStyle"> & { zoomControl?: boolean }) {
  const { style, failed } = useStoopMapStyle();

  if (failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-line text-sm text-ink-3">
        Map unavailable right now
      </div>
    );
  }
  if (!style) return <div className="h-full w-full animate-pulse bg-line" aria-hidden />;

  return (
    <Map
      mapStyle={style}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{ compact: true }}
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      {...props}
    >
      {zoomControl && <NavigationControl showCompass={false} position="bottom-right" />}
      {children}
    </Map>
  );
}

export function PinMarker() {
  return <span className="block size-5 rounded-full border-[3px] border-white bg-ink shadow-md" />;
}
