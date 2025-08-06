"use client";

import { useEffect, useState } from "react";
import { Ad } from "../../types/ad";

import AdCard from "@/components/AdCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [search, setSearch] = useState<string>("");

  function useDebounce<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const timeout = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(timeout);
    }, [value, delay]);

    return debounced;
  }

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetch(`/api/ads?search=${encodeURIComponent(debouncedSearch)}`)
      .then((response) => response.json())
      .then((adsDocs) => {
        setAds(adsDocs);
      });
  }, [debouncedSearch]);

  return (
    <div className="flex w-full">
      <div className="w-1/4 grow p-4 border-r border-gray-200">
        <div className="relative w-full max-w-sm">
          <label htmlFor="search" className="absolute left-3 top-1/2 -translate-y-1/2 !m-0">
            <FontAwesomeIcon icon={faMagnifyingGlass} size="xl" />
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-200 w-full !pl-10 !pr-4 !py-2 placeholder:text-gray-500 outline-0"
          />
        </div>
      </div>
      <div className="w-3/4 grow px-8 bg-gray-100">
        <h2 className="font-bold text-xl mt-4 mb-6">Latest products</h2>
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4
         2xl:grid-cols-5 gap-x-4 gap-y-6 min-h-24"
        >
          {ads && ads.map((ad) => <AdCard key={ad._id} ad={ad} />)}
        </div>
      </div>
    </div>
  );
}
