"use server";

import { connectToDB } from "@/libs/connectToDB";
import { AdModel } from "@/models/Ad";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export async function createAd(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return {
      success: false,
      status: 401,
      message: "Not logged in",
    };
  }

  try {
    await connectToDB();
    const { files, location, ...data } = Object.fromEntries(formData);

    const adDoc = await AdModel.create({
      ...data,
      files: JSON.parse(files as string),
      location: JSON.parse(location as string),
      userEmail: session.user.email,
    });
    return {
      success: true,
      status: 201,
      data: {
        id: adDoc._id.toString(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      message: err.message || "Server error",
    };
  }
}
