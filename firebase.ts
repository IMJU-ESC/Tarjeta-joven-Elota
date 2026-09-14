import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDILZfBb2ioBsGLLLEyyj164nPQTNrlKe0",
  authDomain: "tarjeta-joven-escuinapa.firebaseapp.com",
  projectId: "tarjeta-joven-escuinapa",
  storageBucket: "tarjeta-joven-escuinapa.firebasestorage.app",
  messagingSenderId: "215334618974",
  appId: "1:215334618974:web:e1111ce2a37585afb2f1cf"
};

// Esta línea es la magia: Evita que la app colapse al intentar encender Firebase dos veces
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);