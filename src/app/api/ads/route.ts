import { connectToDB } from "@/libs/connectToDB";
import { AdModel } from "@/models/Ad";

export async function GET() {
  await connectToDB();

  const adsDocs = (await AdModel.find({})).reverse();

  return Response.json(adsDocs);
}
