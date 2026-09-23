import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export function assertAdminEnv() {
  const missing: string[] = [];
  if (!(process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)?.trim()) {
    missing.push("FIREBASE_ADMIN_PROJECT_ID o NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim()) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
  if (missing.length) {
    const error = new Error(`Faltan variables privadas del servidor: ${missing.join(", ")}.`);
    error.name = "FirebaseAdminConfigurationError";
    throw error;
  }
}

function cleanEnv(value?: string) {
  const clean = value?.trim() || "";
  return clean.replace(/^(?:"|')|(?:"|')$/g, "");
}

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId = cleanEnv(process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const clientEmail = cleanEnv(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  const privateKey = cleanEnv(process.env.FIREBASE_ADMIN_PRIVATE_KEY).replace(/\\n/g, "\n");
  const credential = projectId && clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();

  return initializeApp({
    credential,
    storageBucket:
      cleanEnv(process.env.FIREBASE_ADMIN_STORAGE_BUCKET) ||
      cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
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
