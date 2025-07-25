"use client";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { UploadedFile } from "../../../types/imagekit";
import UploadArea from "@/components/UploadArea";
import AdTextInputs from "@/components/AdTextInputs";
import MapPicker from "react-google-map-picker";

const DefaultLocation = { lat: 10, lng: 106 };

export default function NewAdPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [defaultLocation, setDefaultLocation] = useState(DefaultLocation);
  return (
    <form className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-12">
        <div className="grow pt-4">
          <UploadArea files={files} setFiles={setFiles} />
          <div className="mt-8">
            <label htmlFor="">Where is it located?</label>
            <button
              className="flex items-center justify-center w-full
            gap-1 p-1 border text-gray-400"
            >
              <FontAwesomeIcon
                icon={faLocationCrosshairs}
                className="text-lg"
              />
              <span>Share current location</span>
            </button>
            <div className="bg-gray-100 p-4 min-h-12 rounded text-gray-400 text-center mt-2">
              <MapPicker defaultLocation={defaultLocation} apiKey="" />
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
