'use client'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AdsFilters } from "../../types/ad"
import { faMagnifyingGlass, faStore } from "@fortawesome/free-solid-svg-icons";
import CategoryOption from "./CategoryOption";
import { categories } from "@/libs/helpers";

type Props = {
  value: AdsFilters;
  onChange: (next:AdsFilters) => void;
  invalidPrice?: boolean
}

export default function FiltersSidebar({value, onChange, invalidPrice} : Props) {
  const set = <K extends keyof AdsFilters>(key: K, val: AdsFilters[K]) =>
    onChange({...value, [key]: val})

  return (
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
          value={value.search}
          onChange={(e) => set("search", e.target.value)}
          className="bg-gray-200 w-full !pl-10 !pr-4 !py-2 placeholder:text-gray-500 outline-0"
        />
      </div>

      <div className="mt-4 flex flex-col gap-0">
        <h1 className="text-lg font-bold mb-2">Categories</h1>
        <CategoryOption
          value="all"
          label="Browse all"
          icon={faStore}
          checked={value.category === "all"}
          onChange={(v) => set("category", v)}
        />
        {categories.map(({ key, label, icon }) => (
          <CategoryOption
            key={key}
            value={key}
            label={label}
            icon={icon}
            checked={value.category === key}
            onChange={(v) => set("category", v)}
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
            value={value.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
            className="border rounded px-2 py-1 w-24"
            min={0}
          />
          <span>to</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            value={value.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
            className="border rounded px-2 py-1 w-24"
            min={0}
          />
        </div>
        {invalidPrice && (
          <p className="text-sm text-red-600">Min must be ≤ Max</p>
        )}
      </div>
    </div>
  )
}