import { initializeApp, getApps, getApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Evita inicializar Firebase más de una vez durante el desarrollo de Next.js.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Mantiene la sesión aunque se cierre la pestaña o el navegador.
export const authPersistenceReady = typeof window !== "undefined"
  ? setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("No fue posible activar la persistencia local de sesión:", error);
    })
  : Promise.resolve();
export const db = getFirestore(app);
export const storage = getStorage(app);
