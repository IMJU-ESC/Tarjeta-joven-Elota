import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { adminAuth, adminDb, assertAdminEnv } from "@/lib/firebase-admin";
import { removeStoredFile, saveDataUrl } from "@/lib/server-storage";

export const runtime = "nodejs";

const text = (value: unknown, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";
const emailOk = (value: string) => /^\S+@\S+\.\S+$/.test(value);

function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set(["http://localhost:3000", (process.env.APP_URL || "").replace(/\/$/, "")]);
  return allowed.has(origin);
}

function ageFrom(date: string) {
  const birth = new Date(`${date}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export async function POST(request: Request) {
  const createdPaths: string[] = [];
  try {
    assertAdminEnv();
    if (!validOrigin(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
    const body = await request.json();
    const type = body?.tipo === "negocio" ? "negocio" : body?.tipo === "joven" ? "joven" : "";
    const email = text(body?.correo, 180).toLowerCase();
    if (!type || !emailOk(email)) return NextResponse.json({ error: "Datos de registro no válidos." }, { status: 400 });

    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json({ error: "Ese correo ya tiene una cuenta activa." }, { status: 409 });
    } catch (error: any) {
      if (error?.code !== "auth/user-not-found") throw error;
    }

    const collection = type === "joven" ? "jovenes" : "negocios";
    const pendingId = `sol-${crypto.createHash("sha256").update(`${type}:${email}`).digest("hex").slice(0, 28)}`;
    const pendingRef = adminDb.collection(collection).doc(pendingId);
    if ((await pendingRef.get()).exists) return NextResponse.json({ error: "Ya existe una solicitud con ese correo." }, { status: 409 });

    if (type === "joven") {
      const name = text(body?.nombreCompleto);
      const birthDate = text(body?.fechaNacimiento, 10);
      const gender = text(body?.genero, 40);
      const age = ageFrom(birthDate);
      if (!name || !gender || age < 12 || age > 29 || !body?.fotoPerfil || !body?.documentoProbatorio) {
        return NextResponse.json({ error: "Completa correctamente los tres pasos del registro." }, { status: 400 });
      }

      const profile = await saveDataUrl(body.fotoPerfil, "jovenes_perfiles", 1_500_000);
      createdPaths.push(profile.path);
      const proof = await saveDataUrl(body.documentoProbatorio, "jovenes_documentos", 2_500_000);
      createdPaths.push(proof.path);
      await pendingRef.create({
        nombreCompleto: name,
        fechaNacimiento: birthDate,
        genero: gender,
        correo: email,
        fotoPerfil: profile.url,
        fotoPerfilPath: profile.path,
        documentoProbatorio: proof.url,
        documentoProbatorioPath: proof.path,
        estatus: "Pendiente",
        fechaRegistro: new Date().toISOString(),
      });
    } else {
      const name = text(body?.nombreComercial);
      const giro = text(body?.giro, 100);
      const schedule = text(body?.horario, 180);
      const phone = text(body?.telefono, 30);
      const lat = Number(body?.lat);
      const lng = Number(body?.lng);
      if (!name || !giro || !schedule || !phone || !Number.isFinite(lat) || !Number.isFinite(lng) || !body?.logo || !body?.evidenciaFachada || body?.aceptoTerminos !== true) {
        return NextResponse.json({ error: "Completa todos los datos y acepta el aviso de privacidad." }, { status: 400 });
      }

      const logo = await saveDataUrl(body.logo, "negocios_logos", 1_500_000);
      createdPaths.push(logo.path);
      const proof = await saveDataUrl(body.evidenciaFachada, "negocios_evidencias", 1_500_000);
      createdPaths.push(proof.path);
      await pendingRef.create({
        nombreComercial: name,
        giro,
        correo: email,
        logo: logo.url,
        logoPath: logo.path,
        evidenciaFachada: proof.url,
        evidenciaFachadaPath: proof.path,
        lat,
        lng,
        horario: schedule,
        telefono: phone,
        estatus: "Pendiente",
        fechaRegistro: new Date().toISOString(),
        aceptoTerminos: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Registro público:", error);
    await Promise.all(createdPaths.map((path) => removeStoredFile(path).catch(() => undefined)));
    const message = typeof error?.message === "string" && !error.message.includes("FIREBASE_ADMIN")
      ? error.message
      : "No fue posible guardar la solicitud.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
