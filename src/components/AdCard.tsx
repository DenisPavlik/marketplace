"use client";
import { Ad } from "../../types/ad";
import { useRouter } from "next/navigation";
import UploadThumbnail from "@/components/UploadThumbnail";

export default function AdCard({ ad }: { ad: Ad }) {
  const router = useRouter();
  return (
    <div
      className="flex flex-col justify-start cursor-pointer hover:underline"
      key={ad._id}
      onClick={() => router.push("/ad/" + ad._id)}
    >
      {ad.files.length > 0 && (
        <div className="rounded-lg overflow-hidden">
          <UploadThumbnail onClick={() => {}} file={ad.files[0]} />
        </div>
      )}
      <div>
        <p className="font-bold text-lg">${ad.price}</p>
        <h3 className="">{ad.title}</h3>
      </div>
    </div>
  );
}
