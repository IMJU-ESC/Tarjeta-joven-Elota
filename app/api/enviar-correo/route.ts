import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const tiposPermitidos = new Set([
  "aprobacion",
  "rechazo",
  "aprobacion_negocio",
  "rechazo_negocio",
  "recuperacion",
]);

const escaparHtml = (valor: string) =>
  valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export async function POST(req: Request) {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_APP_PASSWORD;
    const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const signatureUrl = process.env.EMAIL_SIGNATURE_URL;

    if (!emailUser || !emailPassword) {
      return NextResponse.json(
        { success: false, error: "El servicio de correo no está configurado." },
        { status: 503 },
      );
    }

    const origen = req.headers.get("origin");
    if (origen && process.env.APP_URL && origen !== appUrl) {
      return NextResponse.json({ success: false, error: "Origen no autorizado." }, { status: 403 });
    }

    const datos = (await req.json()) as Record<string, unknown>;
    const tipo = typeof datos.tipo === "string" ? datos.tipo : "";
    const correo = typeof datos.correo === "string" ? datos.correo.trim() : "";
    const nombre = typeof datos.nombre === "string" ? datos.nombre.trim().slice(0, 150) : "";
    const password = typeof datos.password === "string" ? datos.password.slice(0, 100) : "";
    const motivo = typeof datos.motivo === "string" ? datos.motivo.trim().slice(0, 800) : "";

    if (!tiposPermitidos.has(tipo) || !/^\S+@\S+\.\S+$/.test(correo) || !nombre) {
      return NextResponse.json({ success: false, error: "Solicitud no válida." }, { status: 400 });
    }

    const nombreSeguro = escaparHtml(nombre);
    const correoSeguro = escaparHtml(correo);
    const passwordSeguro = escaparHtml(password);
    const motivoSeguro = escaparHtml(motivo);
    const firma = signatureUrl
      ? `<div style="margin-top:24px"><img src="${escaparHtml(signatureUrl)}" alt="Instituto Municipal de la Juventud de Elota" style="max-width:100%;height:auto;display:block" /></div>`
      : `<p style="margin-top:30px;color:#64748b;font-weight:700">Instituto Municipal de la Juventud de Elota</p>`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPassword },
    });

    let asunto = "";
    let contenido = "";

    if (tipo === "recuperacion") {
      asunto = "Recuperación de acceso a Tarjeta Joven Elota";
      contenido = `
        <p>Hola <strong>${nombreSeguro}</strong>,</p>
        <p>Recibimos una solicitud para recuperar tu acceso.</p>
        <p><strong>Usuario:</strong> ${correoSeguro}<br><strong>Contraseña temporal:</strong> ${passwordSeguro}</p>
        <p>Ingresa en <a href="${appUrl}/login">Tarjeta Joven Elota</a> y cambia tu contraseña al entrar.</p>`;
    } else if (tipo === "aprobacion") {
      asunto = "¡Tu Tarjeta Joven Elota está lista! 🪪";
      contenido = `
        <p>Hola <strong>${nombreSeguro}</strong>,</p>
        <p>Tu solicitud fue aprobada por el Instituto Municipal de la Juventud de Elota.</p>
        <p><strong>Sitio web:</strong> <a href="${appUrl}/login">Tarjeta Joven Elota</a></p>
        <p><strong>Usuario:</strong> ${correoSeguro}<br><strong>Contraseña temporal:</strong> ${passwordSeguro}</p>
        <p>Podrás cambiar tu contraseña después de ingresar.</p>`;
    } else if (tipo === "rechazo") {
      asunto = "Información sobre tu solicitud de Tarjeta Joven Elota";
      contenido = `
        <p>Hola <strong>${nombreSeguro}</strong>,</p>
        <p>Revisamos tu solicitud, pero no fue posible aprobarla por el siguiente motivo:</p>
        <p style="padding:16px;background:#fee2e2;border-left:4px solid #dc2626"><strong>${motivoSeguro}</strong></p>
        <p>Puedes corregir la información y registrarte nuevamente en <a href="${appUrl}/login">Tarjeta Joven Elota</a>.</p>`;
    } else if (tipo === "aprobacion_negocio") {
      asunto = "¡Bienvenido a la red de Negocios Aliados de Elota! 🤝";
      contenido = `
        <p>Hola equipo de <strong>${nombreSeguro}</strong>,</p>
        <p>Su solicitud fue aprobada. Ya forman parte de la red de Negocios Aliados de Tarjeta Joven Elota.</p>
        <p><strong>Portal:</strong> <a href="${appUrl}/login-negocio">Ingresar al Portal de Negocios</a></p>
        <p><strong>Usuario:</strong> ${correoSeguro}<br><strong>Contraseña:</strong> ${passwordSeguro}</p>`;
    } else {
      asunto = "Información sobre su solicitud como Negocio Aliado";
      contenido = `
        <p>Hola equipo de <strong>${nombreSeguro}</strong>,</p>
        <p>Revisamos su solicitud, pero no fue posible aprobarla por el siguiente motivo:</p>
        <p style="padding:16px;background:#fee2e2;border-left:4px solid #dc2626"><strong>${motivoSeguro}</strong></p>
        <p>Pueden corregir la información y registrarse nuevamente en <a href="${appUrl}/login-negocio">el Portal de Negocios</a>.</p>`;
    }

    const html = `
      <div style="font-family:Arial,sans-serif;color:#1e293b;max-width:650px;margin:0 auto;background:#fff;padding:36px;border-radius:16px;border-top:6px solid #D65F08;line-height:1.6">
        ${contenido}
        ${firma}
      </div>`;

    await transporter.sendMail({
      from: `"Tarjeta Joven Elota" <${emailUser}>`,
      to: correo,
      subject: asunto,
      html,
    });

    return NextResponse.json({ success: true, message: "Correo enviado correctamente." });
  } catch (error: unknown) {
    console.error("Error al enviar correo:", error);
    return NextResponse.json({ success: false, error: "Fallo al enviar correo." }, { status: 500 });
  }
}
