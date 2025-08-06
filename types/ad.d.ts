import { UploadResponse } from "imagekit/dist/libs/interfaces";
import { Location } from "./imagekit";

export type Ad = {
  _id?: string;
  userEmail: string;
  title: string;
  price: number;
  category: string;
  description: string;
  contact: string;
  files: UploadResponse[];
  location: Location;
};