import { getUploadAuthParams } from "@imagekit/next/server";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "Sign in to upload photos." }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_IK_PUBLIC_KEY;
  const privateKey = process.env.IK_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return Response.json({ error: "Uploads are not configured." }, { status: 500 });
  }

  const { token, expire, signature } = getUploadAuthParams({
    publicKey,
    privateKey,
    expire: Math.floor(Date.now() / 1000) + 10 * 60,
  });

  return Response.json(
    { token, expire, signature, publicKey, folder: `/stoop/${userId}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
