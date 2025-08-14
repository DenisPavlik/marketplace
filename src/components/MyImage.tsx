"use client";
import Image, { ImageProps } from "next/image";

const imageKitLoader = ({
  src,
  width,
  height,
  quality,
  aicrop,
}: {
  src: string;
  width: number;
  height?: number;
  quality?: number | undefined;
  aicrop?: boolean;
}) => {
  if (src[0] === "/") src = src.slice(1);
  const params = [`w-${width}`];
  if (quality) {
    params.push(`q-${quality}`);
  }
  if (height && aicrop) {
    params.push(`h-${height}`);
  }
  if (aicrop) {
    params.push("fo-auto");
  }
  const paramsString = params.join(",");
  var urlEndpoint = process.env.NEXT_PUBLIC_IK_ENDPOINT as string;
  if (urlEndpoint[urlEndpoint.length - 1] === "/")
    urlEndpoint = urlEndpoint.substring(0, urlEndpoint.length - 1);
  return `${urlEndpoint}/${src}?tr=${paramsString}`;
};

type MyImageProps = ImageProps & {
  aicrop?: boolean;
  width: number;
  height?: number;
};

const MyImage = ({ aicrop, width, height, ...rest }: MyImageProps) => {
  return (
    <Image
      loader={(args) =>
        imageKitLoader({
          ...args,
          width,
          height,
          aicrop,
        })
      }
      width={width}
      height={height}
      {...rest}
    />
  );
};

export default MyImage;
