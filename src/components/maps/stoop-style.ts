"use client";

import { useEffect, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";

const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

/** Stoop palette applied on top of OpenFreeMap's Positron style. */
const PALETTE = {
  land: "#eef0f3",
  residential: "#e8eaee",
  park: "#d8efdf",
  water: "#c6dcf1",
  building: "#e0e3e8",
  road: "#ffffff",
  roadCasing: "#d7dbe1",
  rail: "#cdd1d8",
  label: "#4a505c",
  labelMinor: "#6b7180",
  halo: "#ffffff",
};

type AnyLayer = StyleSpecification["layers"][number] & { paint?: Record<string, unknown> };

function recolor(style: StyleSpecification): StyleSpecification {
  // Highway shields add noise at neighborhood zoom and ship with invalid filters upstream.
  const layers = style.layers.filter((layer) => !layer.id.includes("shield")).map((layer) => {
    const l = { ...layer, paint: { ...((layer as AnyLayer).paint ?? {}) } } as AnyLayer;
    const id = l.id;
    const paint = l.paint!;
    if (l.type === "background") paint["background-color"] = PALETTE.land;
    else if ((id === "water" || id.startsWith("waterway")) && (l.type === "fill" || l.type === "line")) {
      paint[l.type === "line" ? "line-color" : "fill-color"] = PALETTE.water;
    } else if (id === "park" || id === "landcover_wood") paint["fill-color"] = PALETTE.park;
    else if (id === "landuse_residential") paint["fill-color"] = PALETTE.residential;
    else if (id === "building") paint["fill-color"] = PALETTE.building;
    else if (l.type === "line" && id.includes("casing")) paint["line-color"] = PALETTE.roadCasing;
    else if (l.type === "line" && (id.startsWith("highway") || id.startsWith("tunnel") || id.startsWith("road")))
      paint["line-color"] = PALETTE.road;
    else if (l.type === "line" && id.startsWith("railway")) paint["line-color"] = PALETTE.rail;
    else if (l.type === "symbol") {
      paint["text-color"] = id.startsWith("label_city") || id.startsWith("label_town") ? PALETTE.label : PALETTE.labelMinor;
      paint["text-halo-color"] = PALETTE.halo;
    }
    return l as StyleSpecification["layers"][number];
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
