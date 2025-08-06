import { Model, model, models, Schema } from "mongoose";
import { Ad } from "../../types/ad";

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
