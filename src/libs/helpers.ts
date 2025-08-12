import {
  faBabyCarriage,
  faBoxOpen,
  faCar,
  faCouch,
  faHouse,
  faMobileScreenButton,
  faPaw,
  faSackDollar,
  faShirt,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

export const categories = [
  { key: "vehicles", label: "Vehicles", icon: faCar },
  { key: "real_estate", label: "Real Estate", icon: faHouse },
  { key: "electronics", label: "Electronics", icon: faMobileScreenButton },
  { key: "home", label: "Home", icon: faCouch },
  { key: "kids", label: "Kids", icon: faBabyCarriage },
  { key: "pets", label: "Pets", icon: faPaw },
  { key: "jobs", label: "Jobs", icon: faSackDollar },
  { key: "misc", label: "Misc", icon: faBoxOpen },
];

// {
//   vehicles: "🚗 Vehicles",
//   "real-estate": "🏠 Real Estate",
//   electronics: "📱 Electronics",
//   home: "🛋️ Home & Furniture",
//   fashion: "👕 Fashion",
//   kids: "🧸 Kids",
//   pets: "🐾 Pets",
//   jobs: "💼 Jobs & Services",
//   misc: "📦 Misc",
// };
