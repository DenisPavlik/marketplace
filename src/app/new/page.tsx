"use client";
import {
  faLocationCrosshairs,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { UploadedFile } from "../../../types/imagekit";
import UploadArea from "@/components/UploadArea";



export default function NewAdPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
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
              google maps
            </div>
          </div>
        </div>
        <div className="grow">
          <label htmlFor="titleIn">Title</label>
          <input id="titleIn" type="text" placeholder="Title" />
          <label htmlFor="priceIn">Price</label>
          <input id="priceIn" type="number" placeholder="Price" />
          <label htmlFor="categoryIn">Category</label>
          <select name="" id="">
            <option selected disabled id="categoryIn" value="">
              Select category
            </option>
            <option value="">🚗 Vehicles</option>
            <option value="">🏠 Real Estate</option>
            <option value="">📱 Electronics</option>
            <option value="">🛋️ Home & Furniture</option>
            <option value="">👕 Fashion</option>
            <option value="">🧸 Kids</option>
            <option value="">🐾 Pets</option>
            <option value="">💼 Jobs & Services</option>
            <option value="">📦 Misc</option>
          </select>
          <label htmlFor="descriptionIn">Description</label>
          <textarea name="" id="descriptionIn" placeholder="description" />
          <label htmlFor="contactIn">Contact information</label>
          <textarea
            name=""
            id="contactIn"
            placeholder="mobile: +1 347 123 1234"
          />
        </div>
      </div>

      <button type="submit" className="solidBtn w-sm mx-auto">
        Submit
      </button>
    </form>
  );
}
