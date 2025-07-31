import { UploadResponse } from "imagekit/dist/libs/interfaces";
import React from "react";
import MyImage from "./MyImage";

type Props = {
  file: UploadResponse;
  onClick?: () => void;
};

export default function UploadThumbnail({ file, onClick }: Props) {
  function handleClick(ev: React.MouseEvent) {
    ev.preventDefault();
    if (onClick) {
      return onClick();
    } else {
      location.href = file.url;
    }
  }

  if (file.fileType === "image") {
    // const thumbnailUrl = `${file.filePath}?tr=w-200,h-200,crop=force,fo-auto`;
    return (
      <a onClick={handleClick} target="_blank">
        <MyImage
          src={file.filePath}
          alt="photo"
          width={200}
          height={200}
          aicrop={true}
          className="object-cover rounded cursor-pointer"
          style={{ width: 60, height: 60 }}
        />
      </a>
    );
  }
  return <div>{file.url}</div>;
}
