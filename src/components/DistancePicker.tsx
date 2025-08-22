import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import { Location } from "../../types/imagekit";

const defLoc = {
  lat: 40.781499583285544,
  lng: -73.967,
};

export default function DistancePicker() {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [radius, setRadius] = useState(10 * 1000)
  const [center, setCenter] = useState<Location>(defLoc)

  useEffect(() => {
    loadmap();
  }, []);

  async function loadmap() {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    });
    const Core = await loader.importLibrary('core')
    const { Map, Circle } = await loader.importLibrary("maps");
    const map = new Map(divRef.current as HTMLDivElement, {
      mapId: "map",
      center,
      zoom: 8,
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: true
    });
    const circle = new Circle({
      map,
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.35,
      center,
      radius,
      editable: true,
    });

    Core.event.addListener(circle, 'bounds_changed', () => {
      setRadius(circle.getRadius())
    });
    Core.event.addListener(circle, 'center_changed', () => {
      setCenter(circle.getCenter()?.toJSON() as Location)
      if (circle.getCenter()) {
        map.setCenter(circle.getCenter())
      }
    })
  }
  return <div className="w-full h-60" ref={divRef}></div>;
}
