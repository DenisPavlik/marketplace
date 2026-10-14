"use client";

import { Image, type IKImageProps } from "@imagekit/next";
import { IK_ENDPOINT } from "@/lib/imagekit";

/** A ~1 KB blurred version of the photo, painted behind it until the real one arrives. */
function previewUrl(src: IKImageProps["src"]): string | null {
  return typeof src === "string" && src.startsWith("/") ? `${IK_ENDPOINT}${src}?tr=w-32,q-40,bl-8` : null;
}

/** next/image backed by ImageKit's CDN transforms. `src` is an ImageKit file path. */
export function ListingImage({ alt, style, ...props }: Omit<IKImageProps, "urlEndpoint">) {
  const preview = previewUrl(props.src);
  return (
    <Image
      urlEndpoint={IK_ENDPOINT}
      alt={alt}
      style={
        preview
          ? { backgroundImage: `url("${preview}")`, backgroundSize: "cover", backgroundPosition: "center", ...style }
          : style
      }
      {...props}
    />
  );
}
