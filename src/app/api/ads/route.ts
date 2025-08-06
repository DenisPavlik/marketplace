import { connectToDB } from "@/libs/connectToDB";
import { AdModel } from "@/models/Ad";

export async function GET(req: Request) {
  await connectToDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  let adsDocs;

  if (search) {
    adsDocs = await AdModel.find({
      title: { $regex: search, $options: "i" },
    }).sort({ createdAt: -1 });
  } else {
    adsDocs = await AdModel.find({}).sort({ createdAt: -1 });
  }

  return Response.json(adsDocs);
}