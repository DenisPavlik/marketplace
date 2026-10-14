"use client";

import { useEffect, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";

const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

type Paint = Record<string, unknown>;

const STREET_LABEL = "#3b404a";
const AREA_LABEL = "#4a505c";

/** Width that grows with zoom, so streets read clearly at neighborhood scale. */
const width = (stops: [number, number][], base = 1.5) => [
  "interpolate",
  ["exponential", base],
  ["zoom"],
  ...stops.flat(),
];

/**
 * Stoop's palette over OpenFreeMap's Positron style: cool grey land, white
 * streets with enough contrast to read, warm major roads, saturated parks and water.
 */
const OVERRIDES: Record<string, Paint> = {
  background: { "background-color": "#e3e6ea" },
  landuse_residential: { "fill-color": "#dde1e6", "fill-opacity": 1 },
  park: { "fill-color": "#c4e6cd" },
  landcover_wood: { "fill-color": "#c4e6cd" },
  water: { "fill-color": "#9cc6ea" },
  waterway: { "line-color": "#9cc6ea" },
  building: { "fill-color": "#d2d6dd", "fill-outline-color": "#c5cad2" },
  road_area_pier: { "fill-color": "#eef0f3" },
  road_pier: { "line-color": "#eef0f3" },

  highway_path: { "line-color": "#f6f7f9", "line-opacity": 0.8 },
  highway_minor: {
    "line-color": "#ffffff",
    "line-opacity": 1,
    "line-width": width([[11, 0.6], [13, 1.6], [15, 4], [17, 10], [20, 26]]),
  },
  highway_major_subtle: { "line-color": "#ccd1d8" },
  highway_major_casing: {
    "line-color": "#d9c28d",
    "line-width": width([[10, 2.5], [13, 4.5], [16, 11], [20, 30]], 1.3),
  },
  highway_major_inner: {
    "line-color": "#fff5d9",
    "line-width": width([[10, 1.6], [13, 3], [16, 8.5], [20, 26]], 1.3),
  },
  highway_motorway_subtle: { "line-color": "#d9c28d" },
  highway_motorway_casing: { "line-color": "#d3a75c" },
  highway_motorway_inner: { "line-color": "#ffe3ad" },
  highway_motorway_bridge_casing: { "line-color": "#d3a75c" },
  highway_motorway_bridge_inner: { "line-color": "#ffe3ad" },
  tunnel_motorway_casing: { "line-color": "#cdd1d8" },
  tunnel_motorway_inner: { "line-color": "#eef0f3" },

  railway: { "line-color": "#b6bcc6" },
  railway_dashline: { "line-color": "#e3e6ea" },
  railway_transit: { "line-color": "#b6bcc6" },
  railway_transit_dashline: { "line-color": "#e3e6ea" },
  railway_service: { "line-color": "#c3c8d0" },
  railway_service_dashline: { "line-color": "#e3e6ea" },

  boundary_3: { "line-color": "#aab0ba", "line-opacity": 0.5 },
};

type AnyLayer = StyleSpecification["layers"][number] & { paint?: Paint };

function recolor(style: StyleSpecification): StyleSpecification {
  // Highway shields add noise at neighborhood zoom and ship with invalid filters upstream.
  const layers = style.layers
    .filter((layer) => !layer.id.includes("shield"))
    .map((layer) => {
      const paint: Paint = { ...((layer as AnyLayer).paint ?? {}), ...OVERRIDES[layer.id] };
      if (layer.type === "symbol") {
        paint["text-color"] = layer.id.startsWith("highway-name") ? STREET_LABEL : AREA_LABEL;
        paint["text-halo-color"] = "#ffffff";
        paint["text-halo-width"] = 1.4;
      }
      return { ...layer, paint } as StyleSpecification["layers"][number];
    });
  return { ...style, layers };
}

let stylePromise: Promise<StyleSpecification> | null = null;

function loadStyle(): Promise<StyleSpecification> {
  stylePromise ??= fetch(BASE_STYLE_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Map style failed: ${r.status}`);
      return r.json() as Promise<StyleSpecification>;
    })
    .then(recolor)
    .catch((err) => {
      stylePromise = null;
      throw err;
    });
  return stylePromise;
}

/** The recolored style, or null while loading / if tiles are unreachable. */
export function useStoopMapStyle(): { style: StyleSpecification | null; failed: boolean } {
  const [style, setStyle] = useState<StyleSpecification | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadStyle().then(
      (s) => alive && setStyle(s),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, []);
  return { style, failed };
}
