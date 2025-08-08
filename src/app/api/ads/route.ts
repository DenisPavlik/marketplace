import { connectToDB } from "@/libs/connectToDB";
import { AdModel } from "@/models/Ad";
import { FilterQuery } from "mongoose";
import { Ad } from "../../../../types/ad";

export async function GET(req: Request) {
  await connectToDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();

  const query: FilterQuery<Ad> = {};

  if (search) query.title = { $regex: search, $options: "i" };
  if (category && category !== "all") query.category = category;

  const adsDocs = await AdModel.find(query).sort({ createdAt: -1 }).lean();

  return Response.json(adsDocs);
}
