import crypto from "node:crypto";
import { adminBucket } from "@/lib/firebase-admin";

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function saveDataUrl(dataUrl: string, folder: string, maxBytes: number) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match || !allowedMime.has(match[1])) throw new Error("Archivo no válido.");

  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > maxBytes) throw new Error("El archivo supera el tamaño permitido.");

  const extension = match[1] === "application/pdf" ? "pdf" : match[1].split("/")[1].replace("jpeg", "jpg");
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const token = crypto.randomUUID();
  await adminBucket.file(path).save(buffer, {
    resumable: false,
    contentType: match[1],
    metadata: {
      cacheControl: "public,max-age=31536000,immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  return {
    path,
    url: `https://firebasestorage.googleapis.com/v0/b/${adminBucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
  };
}

export async function removeStoredFile(path?: string) {
  if (!path || path.startsWith("http")) return;
  try {
    await adminBucket.file(path).delete();
  } catch (error: any) {
    if (error?.code !== 404) throw error;
  }
}
