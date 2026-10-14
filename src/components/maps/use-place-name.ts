"use client";

import { useCallback } from "react";

// Photon: free OpenStreetMap geocoder (fair-use, no key).
const PHOTON = "https://photon.komoot.io";
const NYC_BIAS = "lat=40.70&lon=-73.95";

type PhotonProps = {
  name?: string;
  locality?: string;
  district?: string;
  city?: string;
  state?: string;
  postcode?: string;
  osm_value?: string;
};

type PhotonResponse = {
  features: { properties: PhotonProps; geometry: { coordinates: [number, number] } }[];
};

/** "Park Slope, Brooklyn" from whatever parts OSM has for a point. */
export function placeLabel(p: PhotonProps): string | null {
  const isArea = p.osm_value && ["neighbourhood", "suburb", "quarter", "city", "town", "village"].includes(p.osm_value);
  const area = p.locality ?? (isArea ? p.name : undefined) ?? p.district ?? p.city;
  const region = p.district && p.district !== area ? p.district : p.city && p.city !== area ? p.city : p.state;
  if (!area) return region ?? null;
  return region ? `${area}, ${region}` : area;
}

async function photon(path: string): Promise<PhotonResponse | null> {
  try {
    const res = await fetch(`${PHOTON}${path}`);
    return res.ok ? ((await res.json()) as PhotonResponse) : null;
  } catch {
    return null;
  }
}

export function usePlaceName() {
  const lookupName = useCallback(async (pos: { lat: number; lng: number }) => {
    const data = await photon(`/reverse?lat=${pos.lat}&lon=${pos.lng}&lang=en`);
    const props = data?.features[0]?.properties;
    return props ? placeLabel(props) : null;
  }, []);

  const searchPlace = useCallback(async (query: string) => {
    if (!query.trim()) return null;
    const data = await photon(`/api/?q=${encodeURIComponent(query)}&limit=1&lang=en&${NYC_BIAS}`);
    const top = data?.features[0];
    if (!top) return null;
    const [lng, lat] = top.geometry.coordinates;
    return { lat, lng, name: placeLabel(top.properties) ?? query };
  }, []);

  return { lookupName, searchPlace };
}
