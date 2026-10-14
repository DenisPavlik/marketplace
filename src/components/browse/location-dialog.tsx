"use client";

import { Marker } from "react-map-gl/maplibre";
import { LocateFixed, Search } from "lucide-react";
import clsx from "clsx";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FlyTo, RadiusCircle } from "@/components/maps/radius-circle";
import { PinMarker, StoopMap } from "@/components/maps/stoop-map";
import { usePlaceName } from "@/components/maps/use-place-name";
import { useGeolocation } from "@/components/maps/use-geolocation";
import { RADIUS_OPTIONS } from "@/lib/filters";
import { milesToKm } from "@/lib/format";

export type LocationValue = { lat: number; lng: number; name: string; radius: number | null };

export function LocationDialog({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  value: LocationValue;
  onApply: (value: LocationValue) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [query, setQuery] = useState("");
  const { lookupName, searchPlace } = usePlaceName();
  const { locating, locate } = useGeolocation();

  // Start from the applied value every time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  async function moveTo(pos: { lat: number; lng: number }, name?: string) {
    setDraft((d) => ({ ...d, ...pos, name: name ?? d.name }));
    if (!name) {
      const found = await lookupName(pos);
      setDraft((d) => (d.lat === pos.lat && d.lng === pos.lng ? { ...d, name: found ?? "Dropped pin" } : d));
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const place = await searchPlace(query);
    if (place) moveTo(place, place.name);
    else toast.error("Couldn't find that place. Try a ZIP code or neighborhood.");
  }

  async function handleLocate() {
    try {
      moveTo(await locate());
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Where are you shopping?"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm text-ink-2">
            <span className="font-semibold text-ink">{draft.name}</span>
            {draft.radius ? ` · within ${draft.radius} mi` : " · any distance"}
          </p>
          <Button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Show listings
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSearch} className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search a neighborhood, city or ZIP</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Neighborhood, city or ZIP"
            className="field-input pl-9"
          />
        </label>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <button
        type="button"
        onClick={handleLocate}
        disabled={locating}
        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline disabled:opacity-60"
      >
        <LocateFixed className="size-4" />
        {locating ? "Finding you…" : "Use my current location"}
      </button>

      <div className="relative mt-4 h-64 overflow-hidden rounded-xl bg-line sm:h-72">
        {open && (
          <StoopMap
            initialViewState={{ latitude: value.lat, longitude: value.lng, zoom: 11.5 }}
            onClick={(e) => moveTo({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
          >
            <Marker latitude={draft.lat} longitude={draft.lng}>
              <PinMarker />
            </Marker>
            {draft.radius ? (
              <RadiusCircle
                id="search-radius"
                center={{ lat: draft.lat, lng: draft.lng }}
                radiusMeters={milesToKm(draft.radius) * 1000}
                fitBounds
              />
            ) : (
              <FlyTo lat={draft.lat} lng={draft.lng} />
            )}
          </StoopMap>
        )}
        <p className="pointer-events-none absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink-2 shadow-sm">
          Tap the map to move the pin
        </p>
      </div>

      <fieldset className="mt-5">
        <legend className="text-[13px] font-semibold">Distance</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[...RADIUS_OPTIONS, null].map((r) => (
            <button
              key={r ?? "any"}
              type="button"
              aria-pressed={draft.radius === r}
              onClick={() => setDraft((d) => ({ ...d, radius: r }))}
              className={clsx(
                "h-9 rounded-full px-3.5 text-[13px] font-semibold ring-1 ring-inset transition-colors",
                draft.radius === r ? "bg-ink text-white ring-ink" : "ring-line-strong hover:ring-ink-3",
              )}
            >
              {r ? `${r} mi` : "Anywhere"}
            </button>
          ))}
        </div>
      </fieldset>
    </Dialog>
  );
}
