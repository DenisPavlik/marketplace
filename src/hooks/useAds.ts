"use client";

import { useEffect, useMemo, useState } from "react";
import { Ad, AdsFilters } from "../../types/ad";
import useDebounce from "./useDebounce";

export function useAds(filters: AdsFilters) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ds = useDebounce(filters.search, 300);
  const dmin = useDebounce(filters.minPrice, 300);
  const dmax = useDebounce(filters.maxPrice, 300);
  const category = filters.category;

  const isPriceRangeValid = useMemo(() => {
    if (dmin === "" || dmax === "") return true;
    const min = Number(dmin);
    const max = Number(dmax);
    if (Number.isNaN(min) || Number.isNaN(max)) return false;
    return min <= max;
  }, [dmin, dmax]);

  useEffect(()=> {
    const params = new URLSearchParams();
    if (ds) params.set("search", ds);
    if (category && category !== "all") params.set("category", category);
    if (isPriceRangeValid) {
      if (dmin !== "") params.set("minPrice", String(Number(dmin)));
      if (dmax !== "") params.set("maxPrice", String(Number(dmax)));
    }

    setLoading(true);
    setError(null);

    fetch(`/api/ads?${params.toString()}`)
      .then((r) => r.json())
      .then((docs) => setAds(docs))
      .catch(() => {
        setAds([]);
        setError("Failed to load ads");
      })
      .finally(() => setLoading(false));

  }, [ds, category, isPriceRangeValid, dmin, dmax])

  return { ads, loading, error, isPriceRangeValid}
}
