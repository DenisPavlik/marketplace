"use client";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormEvent, useState } from "react";
import { Location, UploadedFile } from "../../../types/imagekit";
import UploadArea from "@/components/UploadArea";
import AdTextInputs from "@/components/AdTextInputs";
import LocationPicker from "@/components/LocationPicker";
import { createAd } from "../actions/adActions";
import toast from "react-hot-toast";
import { redirect } from "next/navigation";

const defLoc = {
  lat: 40.781499583285544,
  lng: -73.967,
};

export default function NewAdPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [location, setLocation] = useState<Location>(defLoc);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  function handleLocateMyPosition() {
    function success(position: GeolocationPosition) {
      const { latitude, longitude } = position.coords;
      setLocation({ lat: latitude, lng: longitude });
    }
    navigator.geolocation.getCurrentPosition(success, console.error);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }
    if (location.lat === defLoc.lat && location.lng === defLoc.lng) {
      toast.error("Please set your location.");
      return;
    }
    setIsLoading(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      formData.set("location", JSON.stringify(location));
      formData.set("files", JSON.stringify(files));
      const res = await createAd(formData);

      if (res.success) {
        toast.success("Ad created successfully! ✅");
        redirect("/ad/" + res.data?.id);
      } else {
        toast.error(`Something went wrong: ${res.message} ❌`);
      }
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-12">
        <div className="grow pt-4">
          <UploadArea files={files} setFiles={setFiles} />
          <div className="mt-8">
            <button
              onClick={handleLocateMyPosition}
              type="button"
              className="flex items-center justify-center w-full
            gap-1 p-1 border text-gray-500"
            >
              <FontAwesomeIcon
                icon={faLocationCrosshairs}
                className="text-lg"
              />
              <span>Share current location</span>
            </button>
            <div className="rounded overflow-hidden text-gray-400 text-center mt-2">
              <LocationPicker setLocation={setLocation} location={location} />
            </div>
          </div>
        </div>
        <div className="grow">
          <AdTextInputs />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={
          (isLoading ? "!bg-gray-400 !text-white !border-gray-500" : "") +
          " solidBtn w-sm mx-auto"
        }
      >
        {isLoading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
