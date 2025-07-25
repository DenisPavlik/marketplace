import Image from "next/image";
import { UploadedFile } from "../../types/imagekit";
import { UploadResponse } from "imagekit/dist/libs/interfaces";
import ImageKit from "imagekit-javascript";

const ik = new ImageKit({
  urlEndpoint: process.env.NEXT_PUBLIC_IK_ENDPOINT as string,
});

export default function UploadThumbnail({ file }: { file: UploadResponse }) {
  if (file.fileType === "image") {
    const thumbnailUrl = `${file.url}?tr=w-200,h-200,crop=force,fo-auto`;
    return (
      <a href={file.url} target="_blank">
        <Image
          src={thumbnailUrl}
          alt="photo"
          width={200}
          height={200}
          className="object-cover rounded"
          style={{ width: 60, height: 60 }}
        />
      </a>
    );
  }
  return <div>{file.url}</div>;
}
