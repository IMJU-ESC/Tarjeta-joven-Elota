import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export function assertAdminEnv() {
  const required = ["FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Falta configurar ${missing.join(", ")} en Vercel.`);
}

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");
  const credential = projectId && clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();

  return initializeApp({
    credential,
    storageBucket:
      process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "not-configured.appspot.com",
  });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminBucket = getStorage(adminApp).bucket();

export async function requireAdmin(request: Request) {
  assertAdminEnv();
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new Error("NO_AUTH");

  const decoded = await adminAuth.verifyIdToken(token);
  const adminDoc = await adminDb.collection("administradores").doc(decoded.uid).get();
  if (!adminDoc.exists) throw new Error("NO_ADMIN");

  const rol = adminDoc.data()?.rol;
  if (rol !== "Master" && rol !== "Staff") throw new Error("NO_ADMIN");
  return { uid: decoded.uid, rol };
}
