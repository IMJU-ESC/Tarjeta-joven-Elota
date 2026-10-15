import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { adminAuth, adminDb, requireAdmin } from "@/lib/firebase-admin";
import { publicAppUrl, sendSystemMail } from "@/lib/mailer";
import { CONSENTIMIENTO_VERSION, DECLARACION_NEUTRALIDAD_VERSION } from "@/lib/politica-programa";
import { removeStoredFile, saveDataUrl, validateDataUrl } from "@/lib/server-storage";

export const runtime = "nodejs";

const text = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
const guardianRelationships = new Set(["Madre", "Padre", "Tutor legal"]);

function ageFrom(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return -1;
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return -1;
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day)) age--;
  return age;
}

async function getOrCreateUser(email: string, name: string) {
  try {
    return await adminAuth.getUserByEmail(email);
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") throw error;
    return adminAuth.createUser({
      email,
      displayName: name,
      password: crypto.randomBytes(32).toString("base64url"),
      disabled: false,
    });
  }
}

async function activationLink(email: string, loginPath: string) {
  const appUrl = publicAppUrl();
  const firebaseLink = await adminAuth.generatePasswordResetLink(email, { url: `${appUrl}/${loginPath}`, handleCodeInApp: false });
  try {
    const generated = new URL(firebaseLink);
    const code = generated.searchParams.get("oobCode");
    if (!code) return firebaseLink;
    return `${appUrl}/activar-cuenta?oobCode=${encodeURIComponent(code)}&destino=${encodeURIComponent(loginPath)}`;
  } catch {
    return firebaseLink;
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const body = await request.json();
    const action = text(body?.accion, 30);

    if (action === "crear_admin") {
      if (actor.rol !== "Master") return NextResponse.json({ error: "Solo Master puede crear administradores." }, { status: 403 });
      const email = text(body?.correo, 180).toLowerCase();
      const role = body?.rol === "Master" ? "Master" : "Staff";
      if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Correo no válido." }, { status: 400 });
      const user = await getOrCreateUser(email, "Equipo IMJU Elota");
      await adminDb.collection("administradores").doc(user.uid).set({ correo: email, rol: role, fechaCreacion: new Date().toISOString() }, { merge: true });
      const link = await activationLink(email, "panel-imju-elota");
      await sendSystemMail({ kind: "activation_admin", to: email, name: "Equipo IMJU", actionLink: link });
      return NextResponse.json({ success: true, emailSent: true, uid: user.uid });
    }

    const type = body?.tipo === "negocio" ? "negocio" : body?.tipo === "joven" ? "joven" : "";
    const id = text(body?.id, 160);
    if (!type || !["aprobar", "rechazar", "reenviar", "crear"].includes(action) || (action !== "crear" && !id)) {
      return NextResponse.json({ error: "Solicitud administrativa no válida." }, { status: 400 });
    }

    const collection = type === "joven" ? "jovenes" : "negocios";

    if (action === "crear") {
      const payload = body?.datos || {};
      const email = text(payload.correo, 180).toLowerCase();
      const name = text(type === "joven" ? payload.nombreCompleto : payload.nombreComercial, 160);
      if (!/^\S+@\S+\.\S+$/.test(email) || !name) return NextResponse.json({ error: "Nombre o correo no válidos." }, { status: 400 });
      let youthValidation: { birthDate: string; isMinor: boolean; guardianRelationship: string } | null = null;
      if (type === "joven") {
        const birthDate = text(payload.fechaNacimiento, 10);
        const age = ageFrom(birthDate);
        if (age < 12 || age > 29) return NextResponse.json({ error: "La edad debe estar entre 12 y 29 años." }, { status: 400 });
        if (payload.consentimientoConfirmado !== true) {
          return NextResponse.json({ error: "Confirma que la persona titular aceptó el aviso y las condiciones del programa." }, { status: 400 });
        }
        const isMinor = age < 18;
        const guardianRelationship = text(payload.parentescoTutor, 30);
        if (isMinor && (
          payload.autorizacionTutor !== true ||
          payload.aceptaTerminosTutor !== true ||
          !guardianRelationships.has(guardianRelationship) ||
          typeof payload.documentoTutor !== "string"
        )) {
          return NextResponse.json({ error: "El alta de una persona menor requiere parentesco, credencial y aceptación de su madre, padre o persona tutora." }, { status: 400 });
        }
        if (isMinor) validateDataUrl(payload.documentoTutor, 700_000, true);
        youthValidation = { birthDate, isMinor, guardianRelationship };
      }
      const user = await getOrCreateUser(email, name);
      const active: Record<string, unknown> = {
        correo: email,
        authUid: user.uid,
        estatus: "Activo",
        fechaRegistro: new Date().toISOString(),
        fechaAprobacion: new Date().toISOString(),
      };
      if (type === "joven") {
        const { birthDate, isMinor, guardianRelationship } = youthValidation!;
        Object.assign(active, {
          nombreCompleto: name,
          fechaNacimiento: birthDate,
          localidad: text(payload.localidad, 100),
          genero: text(payload.genero, 40),
          ocupacion: text(payload.ocupacion, 100),
          codigoUnicoQR: `TJE-${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
          aceptoTerminos: true,
          esMenorAlRegistro: isMinor,
          autorizacionTutorDeclarada: isMinor,
          ...(isMinor ? {
            parentescoTutor: guardianRelationship,
            aceptaTerminosTutor: true,
            tutorConsentimientoFecha: new Date().toISOString(),
            documentoTutorVerificadoEnAlta: true,
            documentoTutorEliminado: true,
            documentoTutorEliminadoFecha: new Date().toISOString(),
          } : {}),
          consentimientoVersion: CONSENTIMIENTO_VERSION,
          consentimientoFecha: new Date().toISOString(),
          consentimientoCapturadoPorAdmin: true,
          consentimientoCapturadoPorUid: actor.uid,
          declaracionNeutralidadVersion: DECLARACION_NEUTRALIDAD_VERSION,
        });
        if (typeof payload.fotoPerfil === "string" && payload.fotoPerfil.startsWith("data:")) {
          const image = await saveDataUrl(payload.fotoPerfil, "jovenes_perfiles", 300_000);
          active.fotoPerfil = image.url;
          active.fotoPerfilPath = image.path;
        }
      } else {
        Object.assign(active, {
          nombreComercial: name,
          giro: text(payload.giro, 100),
          horario: text(payload.horario, 180),
          telefono: text(payload.telefono, 30),
          lat: Number(payload.lat),
          lng: Number(payload.lng),
        });
        if (typeof payload.logo === "string" && payload.logo.startsWith("data:")) {
          const image = await saveDataUrl(payload.logo, "negocios_logos", 250_000);
          active.logo = image.url;
          active.logoPath = image.path;
        }
      }
      const batch = adminDb.batch();
      batch.set(adminDb.collection(collection).doc(user.uid), active, { merge: true });
      if (type === "joven") batch.set(adminDb.collection("tarjetas").doc(user.uid), {
        authUid: user.uid,
        codigoUnicoQR: active.codigoUnicoQR,
        estatus: "Activo",
      });
      batch.set(adminDb.collection("sistema").doc("estado"), { ultimaActualizacion: Date.now() }, { merge: true });
      await batch.commit();
      const link = await activationLink(email, type === "joven" ? "login" : "login-negocio");
      let emailSent = true;
      try {
        await sendSystemMail({ kind: type === "joven" ? "activation_youth" : "activation_business", to: email, name, actionLink: link });
      } catch (error) {
        emailSent = false;
        console.error("Correo de alta directa:", error);
      }
      return NextResponse.json({ success: true, emailSent, uid: user.uid });
    }

    const sourceRef = adminDb.collection(collection).doc(id);
    const sourceSnap = await sourceRef.get();
    if (!sourceSnap.exists) return NextResponse.json({ error: "El registro ya no existe." }, { status: 404 });
    const data = sourceSnap.data()!;
    const email = text(data.correo, 180).toLowerCase();
    const name = text(type === "joven" ? data.nombreCompleto : data.nombreComercial, 160);

    if (action === "aprobar" && type === "joven") {
      const age = ageFrom(text(data.fechaNacimiento, 10));
      if (age < 12 || age > 29) return NextResponse.json({ error: "La edad del registro no cumple el rango de 12 a 29 años." }, { status: 400 });
      if (age < 18 && (
        data.autorizacionTutorDeclarada !== true ||
        data.aceptaTerminosTutor !== true ||
        !guardianRelationships.has(text(data.parentescoTutor, 30)) ||
        !data.documentoTutorPath
      )) {
        return NextResponse.json({ error: "No puede aprobarse una persona menor sin parentesco, aceptación y credencial de su madre, padre o persona tutora." }, { status: 400 });
      }
    }

    if (action === "rechazar") {
      const reason = text(body?.motivo, 800);
      if (!reason) return NextResponse.json({ error: "Escribe el motivo del rechazo." }, { status: 400 });
      await Promise.all([
        removeStoredFile(data.documentoProbatorioPath),
        removeStoredFile(data.documentoTutorPath),
        removeStoredFile(data.fotoPerfilPath),
        removeStoredFile(data.evidenciaFachadaPath),
        removeStoredFile(data.logoPath),
      ]);
      await sourceRef.delete();
      let emailSent = true;
      try {
        await sendSystemMail({ kind: type === "joven" ? "rejection_youth" : "rejection_business", to: email, name, reason });
      } catch (error) {
        emailSent = false;
        console.error("Correo de rechazo:", error);
      }
      return NextResponse.json({ success: true, emailSent });
    }

    const user = await getOrCreateUser(email, name);
    const loginPath = type === "joven" ? "login" : "login-negocio";

    if (action === "reenviar") {
      const link = await activationLink(email, loginPath);
      await sendSystemMail({ kind: type === "joven" ? "activation_youth" : "activation_business", to: email, name, actionLink: link });
      return NextResponse.json({ success: true, emailSent: true });
    }

    const activeData: Record<string, unknown> = {
      ...data,
      authUid: user.uid,
      estatus: "Activo",
      fechaAprobacion: new Date().toISOString(),
    };
    delete activeData.contrasena;
    delete activeData.documentoProbatorio;
    delete activeData.documentoProbatorioPath;
    delete activeData.documentoTutor;
    delete activeData.documentoTutorPath;
    delete activeData.documentoTutorMime;
    delete activeData.evidenciaFachada;
    delete activeData.evidenciaFachadaPath;

    if (type === "joven") {
      activeData.codigoUnicoQR = data.codigoUnicoQR || `TJE-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
      if (data.esMenorAlRegistro) {
        activeData.documentoTutorEliminado = true;
        activeData.documentoTutorEliminadoFecha = new Date().toISOString();
      }
    }

    // La evidencia sólo existe para validar la solicitud. Se elimina antes de
    // activar el expediente para impedir que una aprobación conserve el archivo.
    await Promise.all([
      removeStoredFile(data.documentoProbatorioPath),
      removeStoredFile(data.documentoTutorPath),
      removeStoredFile(data.evidenciaFachadaPath),
    ]);

    const targetRef = adminDb.collection(collection).doc(user.uid);
    const batch = adminDb.batch();
    batch.set(targetRef, activeData, { merge: true });
    if (sourceRef.id !== targetRef.id) batch.delete(sourceRef);
    if (type === "joven") {
      batch.set(adminDb.collection("tarjetas").doc(user.uid), {
        authUid: user.uid,
        codigoUnicoQR: activeData.codigoUnicoQR,
        estatus: "Activo",
      });
    }
    batch.set(adminDb.collection("sistema").doc("estado"), { ultimaActualizacion: Date.now() }, { merge: true });
    await batch.commit();

    const link = await activationLink(email, loginPath);
    let emailSent = true;
    try {
      await sendSystemMail({ kind: type === "joven" ? "activation_youth" : "activation_business", to: email, name, actionLink: link });
    } catch (error) {
      emailSent = false;
      console.error("Correo de activación:", error);
    }
    return NextResponse.json({ success: true, emailSent, uid: user.uid });
  } catch (error: any) {
    console.error("Administración de solicitudes:", error);
    const authError = error?.message === "NO_AUTH" || error?.message === "NO_ADMIN";
    return NextResponse.json({ error: authError ? "Sesión administrativa no autorizada." : (error?.message || "No fue posible completar la acción.") }, { status: authError ? 403 : 500 });
  }
}
