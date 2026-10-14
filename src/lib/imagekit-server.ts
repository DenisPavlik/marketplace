import "server-only";
import ImageKit from "@imagekit/nodejs";

let client: ImageKit | null = null;

function getClient(): ImageKit | null {
  const privateKey = process.env.IK_PRIVATE_KEY;
  if (!privateKey) return null;
  client ??= new ImageKit({ privateKey });
  return client;
}

/** Best-effort cleanup of uploaded files; never throws. */
export async function deleteImageKitFiles(fileIds: string[]): Promise<void> {
  const ik = getClient();
  if (!ik || fileIds.length === 0) return;
  try {
    await ik.files.bulk.delete({ fileIds });
  } catch (err) {
    console.error("ImageKit cleanup failed", err);
  }
}
