"use client";

import { Marker } from "react-map-gl/maplibre";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { FlyTo } from "@/components/maps/radius-circle";
import { PinMarker, StoopMap } from "@/components/maps/stoop-map";
import { usePlaceName } from "@/components/maps/use-place-name";
import { useGeolocation } from "@/components/maps/use-geolocation";

export type PickedLocation = { lat: number; lng: number; name: string };

export function LocationField({
  value,
  onChange,
  fallbackCenter,
  error,
}: {
  value: PickedLocation | null;
  onChange: (value: PickedLocation) => void;
  fallbackCenter: { lat: number; lng: number };
  error?: string;
}) {
  const { lookupName } = usePlaceName();
  const { locating, locate } = useGeolocation();

  async function pick(pos: { lat: number; lng: number }) {
    onChange({ ...pos, name: value?.name ?? "" });
    const name = await lookupName(pos);
    if (name) onChange({ ...pos, name });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative h-56 overflow-hidden rounded-xl bg-line ring-1 ring-inset ring-line">
        <StoopMap
          initialViewState={{
            latitude: (value ?? fallbackCenter).lat,
            longitude: (value ?? fallbackCenter).lng,
            zoom: value ? 14 : 11.5,
          }}
          cooperativeGestures
          onClick={(e) => pick({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
        >
          {value && (
            <Marker latitude={value.lat} longitude={value.lng}>
              <PinMarker />
            </Marker>
          )}
          {value && <FlyTo lat={value.lat} lng={value.lng} zoom={14} />}
        </StoopMap>
        {!value && (
          <p className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">
            Tap the map where buyers can pick up
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={locating}
        onClick={async () => {
          try {
            await pick(await locate());
          } catch (err) {
            toast.error((err as Error).message);
          }
        }}
        className="inline-flex items-center gap-2 self-start text-sm font-semibold underline-offset-4 hover:underline disabled:opacity-60"
      >
        <LocateFixed className="size-4" />
        {locating ? "Finding you…" : "Use my current location"}
      </button>
      <label className="sr-only" htmlFor="location-name">
        Area name
      </label>
      <input
        id="location-name"
        value={value?.name ?? ""}
        disabled={!value}
        maxLength={120}
        onChange={(e) => value && onChange({ ...value, name: e.target.value })}
        placeholder="Area shown to buyers, e.g. Park Slope, Brooklyn"
        className="field-input"
        aria-invalid={Boolean(error)}
      />
      <p className="text-[13px] text-ink-3">
        Only an approximate area (about 300 m) is saved. Your exact spot is never shown.
      </p>
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}
