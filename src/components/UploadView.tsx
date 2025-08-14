import { UploadResponse } from "imagekit/dist/libs/interfaces";
import MyImage from "./MyImage";

export default function UploadView({ file }: { file: UploadResponse }) {
  if (file.fileType === "image") {
    return (
      <div
        className="max-h-[600px] max-w-full mx-auto rounded overflow-hidden
      flex justify-center items-center"
      >
        <MyImage
          src={file.filePath}
          alt="product photo"
          width={2048}
          height={2048}
          className="object-contain max-h-[600px] w-auto"
        />
      </div>
    );
  }

  return <span>Image not found</span>;
}
