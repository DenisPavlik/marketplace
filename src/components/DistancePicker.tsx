import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef } from "react";

const defLoc = {
  lat: 40.781499583285544,
  lng: -73.967,
};

export default function DistancePicker() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadmap();
  }, []);

  async function loadmap() {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    });
    const { Map, Circle } = await loader.importLibrary("maps");
    const map = new Map(divRef.current as HTMLDivElement, {
      mapId: "map",
      center: defLoc,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
    });
    const circle = new Circle({
      map,
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.35,
      center: defLoc,
      radius: 100000,
      editable: true,
    });
  }
  return <div className="w-full h-60" ref={divRef}></div>;
}
