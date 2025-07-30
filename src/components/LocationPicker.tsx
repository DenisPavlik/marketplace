"use effect";
import { Loader } from "@googlemaps/js-api-loader";
import { createRef, useEffect } from "react";
import { LocationChangeHandler } from "../../types/imagekit";

export default function LocationPicker({
  onChange,
}: {
  onChange: LocationChangeHandler;
}) {
  const divRef = createRef<HTMLDivElement>();

  async function loadMap() {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    });

    const { Map } = await loader.importLibrary("maps");
    const { AdvancedMarkerElement } = await loader.importLibrary("marker");

    const map = new Map(divRef.current as HTMLDivElement, {
      mapId: "map",
      center: { lat: 0, lng: 0 },
      zoom: 3,
      mapTypeControl: false,
      streetViewControl: false,
    });
    const pin = new AdvancedMarkerElement({
      map,
      position: { lat: 0, lng: 0 },
    });
    map.addListener("click", (ev: any) => {
      pin.position = ev.latLng;
      const lat = ev.latLng.lat();
      const lng = ev.latLng.lng();
      onChange({ lat, lng });
    });
  }

  useEffect(() => {
    loadMap();
  }, []);
  return <div id="map" ref={divRef} className="w-full h-64"></div>;
}
