"use client";

import { useEffect, useMemo, useState } from "react";
import { Ad } from "../../types/ad";

import AdCard from "@/components/AdCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faStore } from "@fortawesome/free-solid-svg-icons";
import { categories } from "@/libs/helpers";
import CategoryOption from "@/components/CategoryOption";

export default function Home() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  function useDebounce<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const timeout = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(timeout);
    }, [value, delay]);

    return debounced;
  }

  const debouncedSearch = useDebounce(search, 300);
  const debouncedMin = useDebounce(minPrice, 300);
  const debouncedMax = useDebounce(maxPrice, 300);

  const isPriceRangeValid = useMemo(() => {
    if (debouncedMin === "" || debouncedMax === "") return true;
    const min = Number(debouncedMin);
    const max = Number(debouncedMax);
    if (Number.isNaN(min) || Number.isNaN(max)) return false;
    return min <= max;
  }, [debouncedMin, debouncedMax]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category && category !== "all") params.set("category", category);

    if (isPriceRangeValid) {
      if (debouncedMin !== '') params.set('minPrice', String(Number(debouncedMin)))
      if (debouncedMax !== '') params.set('maxPrice', String(Number(debouncedMax)))
    }

    fetch(`/api/ads?${params.toString()}`)
      .then((response) => response.json())
      .then((adsDocs) => {
        setAds(adsDocs);
      }).catch(()=>setAds([]))
  }, [debouncedSearch, category, isPriceRangeValid, debouncedMin, debouncedMax]);

  return (
    <div className="flex w-full h-[calc(100vh-78px)]">
      <div className="w-1/4 grow p-4 border-r border-gray-200">
        <div className="relative w-full max-w-sm">
          <label
            htmlFor="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 !m-0"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} size="xl" />
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search Marketplace"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-200 w-full !pl-10 !pr-4 !py-2
            placeholder:text-gray-500 outline-0"
          />
        </div>
        <div className="mt-4 flex flex-col gap-0">
          <h1 className="text-lg font-bold mb-2">Categories</h1>
          <CategoryOption
            value="all"
            label="Browse all"
            icon={faStore}
            checked={category === "all"}
            onChange={setCategory}
          />
          {categories.map(({ key, label, icon }) => (
            <CategoryOption
              key={key}
              value={key}
              label={label}
              icon={icon}
              checked={category === key}
              onChange={setCategory}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <h1 className="text-lg font-bold my-2">Price</h1>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span>to</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          {!isPriceRangeValid && (
            <p className="text-sm text-red-600">Min must be ≤ Max</p>
          )}
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
