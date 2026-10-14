"use client";

import { useEffect, useMemo } from "react";
import { Layer, Source, useMap } from "react-map-gl/maplibre";

type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_008.8;

/** Approximates a geodesic circle as a 64-point polygon. */
export function circlePolygon(center: LatLng, radiusMeters: number, steps = 64): [number, number][] {
  const lat1 = (center.lat * Math.PI) / 180;
  const lng1 = (center.lng * Math.PI) / 180;
  const d = radiusMeters / EARTH_RADIUS_M;
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing));
    const lng2 =
      lng1 + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    ring.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return ring;
}

export function RadiusCircle({
  id,
  center,
  radiusMeters,
  color = "#15171c",
  fitBounds = false,
}: {
  id: string;
  center: LatLng;
  radiusMeters: number;
  color?: string;
  fitBounds?: boolean;
}) {
  const { current: map } = useMap();
  const ring = useMemo(() => circlePolygon(center, radiusMeters), [center, radiusMeters]);

  useEffect(() => {
    if (!fitBounds || !map) return;
    const lngs = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 28, duration: 500 },
    );
  }, [map, ring, fitBounds]);

  return (
    <Source id={id} type="geojson" data={{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } }}>
      <Layer id={`${id}-fill`} type="fill" paint={{ "fill-color": color, "fill-opacity": 0.08 }} />
      <Layer id={`${id}-line`} type="line" paint={{ "line-color": color, "line-width": 2, "line-opacity": 0.9 }} />
    </Source>
  );
}

/** Smoothly recenters the map when the point changes. */
export function FlyTo({ lat, lng, zoom }: LatLng & { zoom?: number }) {
  const { current: map } = useMap();
  useEffect(() => {
    map?.easeTo({ center: [lng, lat], zoom, duration: 500 });
  }, [map, lat, lng, zoom]);
  return null;
}
