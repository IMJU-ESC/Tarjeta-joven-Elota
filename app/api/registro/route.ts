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
  try {
    if (origin === new URL(request.url).origin) return true;
  } catch {
    // La comparación con APP_URL sigue funcionando si el proxy no expone URL absoluta.
  }
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

function publicRegistrationError(error: any) {
  const message = typeof error?.message === "string" ? error.message : "";
  const code = typeof error?.code === "string" ? error.code : "";

  if (error?.name === "FirebaseAdminConfigurationError" || message.includes("FIREBASE_ADMIN")) {
    const entorno = process.env.VERCEL_ENV === "preview" ? "Preview" : process.env.VERCEL_ENV === "production" ? "Producción" : "actual";
    return {
      status: 503,
      code: "CONFIG_ADMIN",
      error: `El entorno ${entorno} de Vercel no tiene habilitadas las credenciales privadas de Firebase Admin. Activa FIREBASE_ADMIN_CLIENT_EMAIL y FIREBASE_ADMIN_PRIVATE_KEY para este entorno y vuelve a desplegar.`,
    };
  }
  if (code.includes("storage") || code === 404 || /bucket|storage/i.test(message)) {
    return {
      status: 503,
      code: "CONFIG_STORAGE",
      error: "No se pudo guardar la imagen en Firebase Storage. Verifica FIREBASE_ADMIN_STORAGE_BUCKET y que Storage esté habilitado.",
    };
  }
  if (code === 7 || code === "permission-denied" || /permission|credential/i.test(message)) {
    return {
      status: 503,
      code: "CONFIG_CREDENTIALS",
      error: "Firebase rechazó la escritura del servidor. Verifica que la cuenta de servicio pertenezca al mismo proyecto de Elota.",
    };
  }
  if (/invalid.*private key|failed to parse private key|pem/i.test(message)) {
    return {
      status: 503,
      code: "CONFIG_PRIVATE_KEY",
      error: "La llave privada de Firebase Admin no tiene el formato correcto en Vercel. Debe copiarse completa, incluyendo BEGIN y END PRIVATE KEY.",
    };
  }
  if (message === "Archivo no válido." || message === "El archivo supera el tamaño permitido.") {
    return { status: 400, code: "INVALID_FILE", error: message };
  }
  return {
    status: 500,
    code: "REGISTRATION_FAILED",
    error: "No fue posible guardar la solicitud. Revisa el registro de Functions en Vercel e inténtalo nuevamente.",
  };
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

      const profile = await saveDataUrl(body.fotoPerfil, "jovenes_perfiles", 300_000);
      createdPaths.push(profile.path);
      const proofLimit = String(body.documentoProbatorio).startsWith("data:application/pdf") ? 1_500_000 : 700_000;
      const proof = await saveDataUrl(body.documentoProbatorio, "jovenes_documentos", proofLimit);
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

      const logo = await saveDataUrl(body.logo, "negocios_logos", 250_000);
      createdPaths.push(logo.path);
      const proof = await saveDataUrl(body.evidenciaFachada, "negocios_evidencias", 500_000);
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
    const response = publicRegistrationError(error);
    return NextResponse.json({ error: response.error, code: response.code }, { status: response.status });
  }
}
