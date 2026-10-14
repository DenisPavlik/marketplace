"use client";

import { RadiusCircle } from "@/components/maps/radius-circle";
import { StoopMap } from "@/components/maps/stoop-map";

/** Shows an approximate pickup area, never the exact pin. */
export function AreaMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="h-56 overflow-hidden rounded-xl bg-line">
      <StoopMap initialViewState={{ latitude: lat, longitude: lng, zoom: 13.5 }} cooperativeGestures>
        <RadiusCircle id="pickup-area" center={{ lat, lng }} radiusMeters={450} color="#ff6b4a" />
      </StoopMap>
    </div>
  );
}
