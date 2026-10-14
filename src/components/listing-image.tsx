"use client";

import { Image, type IKImageProps } from "@imagekit/next";
import { IK_ENDPOINT } from "@/lib/imagekit";

/** next/image backed by ImageKit's CDN transforms. `src` is an ImageKit file path. */
export function ListingImage({ alt, ...props }: Omit<IKImageProps, "urlEndpoint">) {
  return <Image urlEndpoint={IK_ENDPOINT} alt={alt} {...props} />;
}
