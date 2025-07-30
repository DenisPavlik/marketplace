import { UploadResponse } from "imagekit/dist/libs/interfaces";
import { Model, model, models, Schema } from "mongoose";
import { Location } from "../../types/imagekit";

type Ad = {
  userEmail: string;
  title: string;
  price: number;
  category: string;
  description: string;
  contact: string;
  files: UploadResponse[];
  location: Location;
};

const adSchema = new Schema<Ad>(
  {
    userEmail: { type: String, required: true },
    title: String,
    price: Number,
    category: String,
    description: String,
    contact: String,
    files: [Object],
    location: Object,
  },
  {
    timestamps: true,
  }
);

export const AdModel = (models?.Ad as Model<Ad>) || model<Ad>('Ad', adSchema)
