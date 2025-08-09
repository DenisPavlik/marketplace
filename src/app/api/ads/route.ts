import { connectToDB } from "@/libs/connectToDB";
import { AdModel } from "@/models/Ad";
import { FilterQuery } from "mongoose";
import { Ad } from "../../../../types/ad";

export async function GET(req: Request) {
  await connectToDB();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");

    const query: FilterQuery<Ad> = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (category && category !== "all") query.category = category;

    const min = minPriceParam != null ? parseFloat(minPriceParam) : undefined;
    const max = maxPriceParam != null ? parseFloat(maxPriceParam) : undefined;

    const minOk = min !== undefined && !Number.isNaN(min);
    const maxOk = max !== undefined && !Number.isNaN(max);

    if (minOk || maxOk) {
      let gte = minOk ? Math.max(0, min!) : undefined;
      let lte = maxOk ? Math.max(0, max!) : undefined;

      if (gte !== undefined && lte !== undefined && gte > lte) {
        [gte, lte] = [lte, gte];
      }

      query.price = {};
      if (gte !== undefined) query.price.$gte = gte;
      if (lte !== undefined) query.price.$lte = lte;
    }

    const adsDocs = await AdModel.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return Response.json(adsDocs);
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
    });
  }
}
