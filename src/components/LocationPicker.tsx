"use effect";
import { Loader } from "@googlemaps/js-api-loader";
import { createRef, Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Location } from "../../types/imagekit";



export default function LocationPicker({
  location,
  setLocation
}: {
  location: Location,
  setLocation: Dispatch<SetStateAction<Location>>
}) {
  const divRef = createRef<HTMLDivElement>();
  const mapRef = useRef<google.maps.Map | null>(null)
  const pinRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)

  async function loadMap() {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    });

    const { Map } = await loader.importLibrary("maps");
    const { AdvancedMarkerElement } = await loader.importLibrary("marker");

    const map = new Map(divRef.current as HTMLDivElement, {
      mapId: "map",
      center: location,
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
    });
    const pin = new AdvancedMarkerElement({
      map,
      position: location,
    });
    map.addListener("click", (ev: any) => {
      const lat = ev.latLng.lat();
      const lng = ev.latLng.lng();
      setLocation({ lat, lng });
    });

    mapRef.current = map;
    pinRef.current = pin;
  }

  useEffect(() => {
    loadMap();
  }, []);

  useEffect(() => {
    if (mapRef.current && pinRef.current) {
      pinRef.current.position = location;
      mapRef.current.setCenter(location);
      mapRef.current.setZoom(14)
    }
  }, [location]);


  return <div id="map" ref={divRef} className="w-full h-64"></div>;
}
