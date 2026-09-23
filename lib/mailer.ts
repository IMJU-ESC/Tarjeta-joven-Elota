import nodemailer from "nodemailer";

type MailKind = "activation_youth" | "activation_business" | "activation_admin" | "rejection_youth" | "rejection_business";

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export function publicAppUrl() {
  const previewUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const preferred = process.env.VERCEL_ENV === "preview" ? previewUrl : process.env.APP_URL || previewUrl;
  return (preferred || "http://localhost:3000").replace(/\/$/, "");
}

export async function sendSystemMail(input: {
  kind: MailKind;
  to: string;
  name: string;
  actionLink?: string;
  reason?: string;
}) {
  const user = process.env.EMAIL_USER?.trim();
  const password = process.env.EMAIL_APP_PASSWORD?.trim();
  if (!user || !password) throw new Error("El correo institucional no está configurado.");

  const appUrl = publicAppUrl();
  const name = escapeHtml(input.name);
  const actionLink = input.actionLink ? escapeHtml(input.actionLink) : "";
  const reason = escapeHtml(input.reason || "Información incompleta");
  const business = input.kind.includes("business");
  const admin = input.kind === "activation_admin";
  const activation = input.kind.startsWith("activation");
  const loginUrl = `${appUrl}/${admin ? "panel-imju-elota" : business ? "login-negocio" : "login"}`;
  const imjuLogo = `${appUrl}/imju-elota-original.jpg`;
  const cityLogo = `${appUrl}/ayuntamiento-elota-original.jpg`;

  const subject = activation
    ? admin ? "Activa tu acceso al panel de Tarjeta Joven Elota" : business ? "¡Tu negocio ya es aliado de Tarjeta Joven Elota!" : "¡Tu Tarjeta Joven Elota está lista!"
    : business ? "Actualización de tu solicitud de Negocio Aliado" : "Actualización de tu solicitud de Tarjeta Joven";

  const content = activation
    ? `<p>Hola <strong>${name}</strong>,</p>
       <p>Tu solicitud fue aprobada. Para proteger tu cuenta, crea tu contraseña personal desde este botón:</p>
       <p style="text-align:center;margin:30px 0"><a href="${actionLink}" style="display:inline-block;background:linear-gradient(135deg,#64748B,#f70476);color:#fff;text-decoration:none;padding:16px 26px;border-radius:16px;font-weight:900;box-shadow:0 10px 24px rgba(15,118,110,.22)">Crear mi contraseña →</a></p>
       <p>Después podrás ingresar en <a href="${loginUrl}">${admin ? "el panel administrativo" : business ? "el Portal de Negocios" : "Tarjeta Joven Elota"}</a>.</p>
       <p style="font-size:12px;color:#64748b">El enlace es personal. Si caduca, solicita uno nuevo desde la pantalla de acceso.</p>`
    : `<p>Hola <strong>${name}</strong>,</p>
       <p>Revisamos tu solicitud, pero por ahora no fue posible aprobarla:</p>
       <p style="padding:16px;background:#fff1f2;border-left:4px solid #e11d48;border-radius:8px"><strong>${reason}</strong></p>
       <p>Puedes corregir la información y enviar una nueva solicitud desde <a href="${loginUrl}">Tarjeta Joven Elota</a>.</p>`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
  });

  await transporter.sendMail({
    from: `"Tarjeta Joven Elota" <${user}>`,
    to: input.to,
    subject,
    html: `<div style="margin:0;padding:26px 12px;background:#f3f5f9;font-family:Aptos,'Segoe UI',Arial,sans-serif;color:#172033">
      <div style="max-width:620px;margin:auto;overflow:hidden;background:#ffffff;border:1px solid #cbd5e1;border-radius:26px;box-shadow:0 18px 50px rgba(15,23,42,.09)">
        <div style="padding:22px 26px;background:#080d18;text-align:center">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:auto"><tr>
            <td style="padding:5px"><img src="${imjuLogo}" alt="IMJU Elota" width="116" style="display:block;width:116px;height:62px;object-fit:contain;background:#fff;border-radius:14px;padding:5px"></td>
            <td style="padding:5px"><img src="${cityLogo}" alt="H. Ayuntamiento de Elota" width="130" style="display:block;width:130px;height:62px;object-fit:contain;background:#fff;border-radius:14px;padding:5px"></td>
          </tr></table>
          <p style="margin:14px 0 0;color:#94a3b8;font-size:11px;font-weight:900;letter-spacing:2px">TARJETA JOVEN ELOTA</p>
        </div>
        <div style="padding:34px 30px;line-height:1.7">
          ${content}
          <div style="margin-top:32px;padding-top:22px;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#334155;font-size:13px;font-weight:800">Instituto Municipal de la Juventud de Elota</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:11px">Av. Gabriel Leyva S/N, Centro, La Cruz, Sinaloa</p>
          </div>
        </div>
        <div style="height:7px;background:linear-gradient(90deg,#64748B,#f4c425,#25883a,#24b5d6,#f70476)"></div>
      </div>
    </div>`,
  });
}
