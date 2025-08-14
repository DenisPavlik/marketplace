"use client";

import { Ad } from "../../types/ad";
import AdCard from "./AdCard";

export default function AdsGrid({
  ads,
  loading,
  error,
}: {
  ads: Ad[];
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <div className="w-3/4 grow px-8 bg-gray-100">
      <h2 className="font-bold text-xl mt-4 mb-6">Latest products</h2>

      {error && (
        <div className="mt-4 mb-6 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="flex items-center justify-center mt-24">Loading…</div>
      )}

      {!loading && !error && ads.length < 1 && (
        <div className="flex items-center justify-center mt-24">
          No listing ads yet
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6 min-h-24">
        {!error && ads.map((ad) => <AdCard key={ad._id} ad={ad} />)}
      </div>
    </div>
  );
}
