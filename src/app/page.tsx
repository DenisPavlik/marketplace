"use client";

import { useState } from "react";
import { AdsFilters } from "../../types/ad";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faStore } from "@fortawesome/free-solid-svg-icons";
import { categories } from "@/libs/helpers";
import CategoryOption from "@/components/CategoryOption";
import AdsGrid from "@/components/AdsGrid";
import { useAds } from "@/hooks/useAds";
import FiltersSidebar from "@/components/FiltersSidebar";

export default function Home() {
  const [filters, setFilters] = useState<AdsFilters>({
    search: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
  });

  const { ads, loading, error, isPriceRangeValid } = useAds(filters);

  return (
    <div className="flex w-full h-[calc(100vh-78px)]">
      <FiltersSidebar
        value={filters}
        onChange={setFilters}
        invalidPrice={!isPriceRangeValid}
      />
      <AdsGrid ads={ads} loading={loading} error={error} />
    </div>
  );
}
