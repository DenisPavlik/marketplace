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
    return (
      <a onClick={handleClick} target="_blank">
        <MyImage
          src={file.filePath}
          alt="photo"
          width={300}
          height={300}
          aicrop={true}
        />
      </a>
    );
  }
  return <div>{file.url}</div>;
}
