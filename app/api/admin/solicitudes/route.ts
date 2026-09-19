import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { adminAuth, adminDb, requireAdmin } from "@/lib/firebase-admin";
import { sendSystemMail } from "@/lib/mailer";
import { removeStoredFile, saveDataUrl } from "@/lib/server-storage";

export const runtime = "nodejs";

const text = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";

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
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
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
      const user = await getOrCreateUser(email, name);
      const active: Record<string, unknown> = {
        correo: email,
        authUid: user.uid,
        estatus: "Activo",
        fechaRegistro: new Date().toISOString(),
        fechaAprobacion: new Date().toISOString(),
      };
      if (type === "joven") {
        Object.assign(active, {
          nombreCompleto: name,
          fechaNacimiento: text(payload.fechaNacimiento, 10),
          localidad: text(payload.localidad, 100),
          genero: text(payload.genero, 40),
          ocupacion: text(payload.ocupacion, 100),
          codigoUnicoQR: `TJE-${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
        });
        if (typeof payload.fotoPerfil === "string" && payload.fotoPerfil.startsWith("data:")) {
          const image = await saveDataUrl(payload.fotoPerfil, "jovenes_perfiles", 1_500_000);
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
          const image = await saveDataUrl(payload.logo, "negocios_logos", 1_500_000);
          active.logo = image.url;
          active.logoPath = image.path;
        }
      }
      const batch = adminDb.batch();
      batch.set(adminDb.collection(collection).doc(user.uid), active, { merge: true });
      if (type === "joven") batch.set(adminDb.collection("tarjetas").doc(user.uid), {
        authUid: user.uid,
        codigoUnicoQR: active.codigoUnicoQR,
        nombreCompleto: active.nombreCompleto,
        genero: active.genero,
        fechaNacimiento: active.fechaNacimiento,
        fotoPerfil: active.fotoPerfil || null,
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

    if (action === "rechazar") {
      const reason = text(body?.motivo, 800);
      if (!reason) return NextResponse.json({ error: "Escribe el motivo del rechazo." }, { status: 400 });
      await Promise.all([
        removeStoredFile(data.documentoProbatorioPath),
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
    delete activeData.evidenciaFachada;
    delete activeData.evidenciaFachadaPath;

    if (type === "joven") {
      activeData.codigoUnicoQR = data.codigoUnicoQR || `TJE-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
    }

    const targetRef = adminDb.collection(collection).doc(user.uid);
    const batch = adminDb.batch();
    batch.set(targetRef, activeData, { merge: true });
    if (sourceRef.id !== targetRef.id) batch.delete(sourceRef);
    if (type === "joven") {
      batch.set(adminDb.collection("tarjetas").doc(user.uid), {
        authUid: user.uid,
        codigoUnicoQR: activeData.codigoUnicoQR,
        nombreCompleto: activeData.nombreCompleto,
        genero: activeData.genero || "No especificado",
        fechaNacimiento: activeData.fechaNacimiento,
        fotoPerfil: activeData.fotoPerfil,
        estatus: "Activo",
      });
    }
    batch.set(adminDb.collection("sistema").doc("estado"), { ultimaActualizacion: Date.now() }, { merge: true });
    await batch.commit();
    await Promise.all([removeStoredFile(data.documentoProbatorioPath), removeStoredFile(data.evidenciaFachadaPath)]);

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
