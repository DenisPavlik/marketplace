"use client";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Location, UploadedFile } from "../../../types/imagekit";
import UploadArea from "@/components/UploadArea";
import AdTextInputs from "@/components/AdTextInputs";
import LocationPicker from "@/components/LocationPicker";

export default function NewAdPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [location, setLocation] = useState<Location>();

  return (
    <form className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-12">
        <div className="grow pt-4">
          <UploadArea files={files} setFiles={setFiles} />
          <div className="mt-8">
            <button
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
              <LocationPicker onChange={(location) => setLocation(location)} />
            </div>
          </div>
        </div>
        <div className="grow">
          <AdTextInputs />
        </div>
      </div>

      <button type="submit" className="solidBtn w-sm mx-auto">
        Submit
      </button>
    </form>
  );
}
