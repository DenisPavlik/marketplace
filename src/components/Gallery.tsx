"use client";

import { UploadResponse } from "imagekit/dist/libs/interfaces";
import UploadView from "./UploadView";
import UploadThumbnail from "./UploadThumbnail";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import MyImage from "./MyImage";

export default function Gallery({ files }: { files: UploadResponse[] }) {
  const [activeFile, setActiveFile] = useState<UploadResponse | null>(
    files?.[0] || null
  );

  const activeIndex = files.findIndex((f) => f.fileId === activeFile?.fileId);

  function prev() {
    if (activeIndex > 0) {
      setActiveFile(files[activeIndex - 1]);
    } else {
      setActiveFile(files[files.length - 1]);
    }
  }
  function next() {
    if (activeIndex !== files.length - 1) {
      setActiveFile(files[activeIndex + 1]);
    } else {
      setActiveFile(files[0]);
    }
  }
  return (
    <>
      {activeFile && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <MyImage
            src={activeFile.filePath}
            alt="bg"
            width={1000}
            height={1000}
            className="object-cover opacity-20 blur w-full h-full"
          />
        </div>
      )}
      <div className="grow flex items-center justify-center relative">
        {activeFile && (
          <>
            <div className="p-8 z-10">
              <UploadView key={activeFile.fileId} file={activeFile} />
            </div>
            <div className="absolute inset-12 flex justify-between z-10">
              <button>
                <FontAwesomeIcon
                  onClick={prev}
                  className="px-5 py-3.5 bg-gray-200/10 rounded-full text-2xl
                  hover:bg-gray-200/50 duration-300 cursor-pointer"
                  icon={faChevronLeft}
                />
              </button>
              <button>
                <FontAwesomeIcon
                  onClick={next}
                  className="px-5 py-3.5 bg-gray-200/10 rounded-full text-2xl
                  hover:bg-gray-200/30 duration-200 cursor-pointer"
                  icon={faChevronRight}
                />
              </button>
            </div>
          </>
        )}
      </div>
      <div className="p-4 flex items-center justify-center gap-4 z-10">
        {files.map((file) => (
          <UploadThumbnail
            onClick={() => setActiveFile(file)}
            key={file.fileId}
            file={file}
          />
        ))}
      </div>
    </>
  );
}
