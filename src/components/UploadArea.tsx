import { Dispatch, SetStateAction, useRef, useState } from "react";
import { UploadedFile } from "../../types/imagekit";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faPlus } from "@fortawesome/free-solid-svg-icons";
import Uploader from "./Uploader";
import clsx from "clsx";
import UploadThumbnail from "./UploadThumbnail";

type Props = {
  files: UploadedFile[];
  setFiles: Dispatch<SetStateAction<UploadedFile[]>>;
};

export default function UploadArea({ files, setFiles }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-center text-xs text-gray-400 uppercase font-bold">
        Add photos of your product:
      </h2>
      <div className="flex flex-col">
        <FontAwesomeIcon
          icon={faImage}
          className="text-8xl my-1 text-gray-300"
        />

        <button
          disabled={isUploading}
          className={clsx(
            "outlineBtn",
            isUploading
              ? "!bg-gray-100 !cursor-not-allowed !border-gray-300 !text-gray-400"
              : ""
          )}
          type="button"
          onClick={() => uploadRef.current?.click()}
        >
          <Uploader
            ref={uploadRef}
            className="hidden"
            onSuccess={(file: any) => {
              setFiles((prev) => [...prev, file]);
              setIsUploading(false);
            }}
            onUploadStart={() => {
              setIsUploading(true);
            }}
          />
          <div className="flex items-center justify-center gap-1 p-1 text-sm">
            {isUploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} />
                <span>Add photos</span>
              </>
            )}
          </div>
        </button>
        <div className="flex gap-1 py-2 items-center flex-wrap">
          {files.map((file:any) => (
          <UploadThumbnail key={file.fileId} file={file} />
        ))}
        </div>
      </div>
    </div>
  );
}
