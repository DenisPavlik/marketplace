"use client";

import { useCallback, useState } from "react";

export function useGeolocation() {
  const [locating, setLocating] = useState(false);

  const locate = useCallback(
    () =>
      new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!("geolocation" in navigator)) {
          reject(new Error("Your browser can't share its location."));
          return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocating(false);
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => {
            setLocating(false);
            reject(
              new Error(
                err.code === err.PERMISSION_DENIED
                  ? "Location access is blocked. Allow it in your browser, or pick a spot on the map."
                  : "Couldn't find your location. Pick a spot on the map instead.",
              ),
            );
          },
          { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
        );
      }),
    [],
  );

  return { locating, locate };
}
