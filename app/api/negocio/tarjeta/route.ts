import { NextResponse } from "next/server";
import { adminDb, requireActiveBusiness } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const text = (value: unknown, max = 180) => typeof value === "string" ? value.trim().slice(0, max) : "";

function nivel(visitas: number) {
  if (visitas >= 40) return { numero: 3, nombre: "Black" };
  if (visitas >= 15) return { numero: 2, nombre: "Oro" };
  return { numero: 1, nombre: "Clásica" };
}

function cumpleHoy(fechaNacimiento?: string) {
  if (!fechaNacimiento) return false;
  const fecha = new Date(`${fechaNacimiento}T12:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return false;
  const hoy = new Date();
  return fecha.getUTCMonth() === hoy.getUTCMonth() && fecha.getUTCDate() === hoy.getUTCDate();
}

async function buscarTarjeta(codigo: string) {
  if (!/^TJE-[A-F0-9]{24}$/.test(codigo)) throw new Error("QR_INVALIDO");
  const tarjetas = await adminDb.collection("tarjetas").where("codigoUnicoQR", "==", codigo).limit(1).get();
  if (tarjetas.empty || tarjetas.docs[0].data().estatus !== "Activo") throw new Error("QR_INVALIDO");

  const uid = tarjetas.docs[0].id;
  const joven = await adminDb.collection("jovenes").doc(uid).get();
  if (!joven.exists || joven.data()?.estatus !== "Activo") throw new Error("QR_INVALIDO");
  return { uid, datos: joven.data()! };
}

async function visitasDelNegocio(ownerUid: string) {
  return adminDb.collection("visitas").where("ownerUid", "==", ownerUid).get();
}

function visitasRecientes(snap: FirebaseFirestore.QuerySnapshot, youthUid: string) {
  const limite = Date.now() - 90 * 24 * 60 * 60 * 1000;
  return snap.docs.filter((visita) => {
    const data = visita.data();
    return data.youthUid === youthUid && new Date(data.fecha).getTime() >= limite;
  });
}

export async function POST(request: Request) {
  try {
    const actor = await requireActiveBusiness(request);
    const body = await request.json();
    const action = text(body?.accion, 20);

    if (action === "deshacer") {
      const visitaId = text(body?.visitaId, 160);
      if (!visitaId) return NextResponse.json({ error: "Movimiento no válido." }, { status: 400 });
      const ref = adminDb.collection("visitas").doc(visitaId);
      const snap = await ref.get();
      if (!snap.exists || snap.data()?.ownerUid !== actor.uid) return NextResponse.json({ error: "Movimiento no encontrado." }, { status: 404 });
      const creada = new Date(snap.data()?.fecha || 0).getTime();
      if (!creada || Date.now() - creada > 15 * 60 * 1000) {
        return NextResponse.json({ error: "El plazo para deshacer este movimiento terminó." }, { status: 409 });
      }
      await ref.delete();
      return NextResponse.json({ success: true });
    }

    if (action !== "validar" && action !== "registrar") {
      return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
    }

    const codigo = text(body?.codigoQR, 80).toUpperCase();
    const tarjeta = await buscarTarjeta(codigo);
    const todasLasVisitas = await visitasDelNegocio(actor.uid);
    const recientes = visitasRecientes(todasLasVisitas, tarjeta.uid);
    const rango = nivel(recientes.length);
    const esCumple = cumpleHoy(tarjeta.datos.fechaNacimiento);

    if (action === "validar") {
      return NextResponse.json({
        tarjeta: {
          idFirebase: tarjeta.uid,
          codigoUnicoQR: codigo,
          nombreCompleto: text(tarjeta.datos.nombreCompleto),
          fotoPerfil: typeof tarjeta.datos.fotoPerfil === "string" ? tarjeta.datos.fotoPerfil : null,
          visitasTotales: recientes.length,
          nivelUserNum: rango.numero,
          nivelNombre: rango.nombre,
          esCumple,
        },
      });
    }

    const promoId = text(body?.promoId, 160);
    let nombrePromo = "Visita estándar";
    const ultimaVisita = recientes.reduce((ultima, visita) => {
      const fecha = new Date(visita.data().fecha || 0).getTime();
      return Math.max(ultima, Number.isFinite(fecha) ? fecha : 0);
    }, 0);
    if (ultimaVisita && Date.now() - ultimaVisita < 60_000) {
      return NextResponse.json({ error: "Esta tarjeta ya registró una visita hace menos de un minuto." }, { status: 409 });
    }

    if (promoId) {
      const promo = await adminDb.collection("promociones").doc(promoId).get();
      const datosPromo = promo.data();
      if (!promo.exists || datosPromo?.ownerUid !== actor.uid || datosPromo?.estatus !== "Activa") {
        return NextResponse.json({ error: "La promoción ya no está disponible." }, { status: 409 });
      }

      const jerarquia: Record<string, number> = { "Clásica": 1, "Oro": 2, "Black": 3 };
      if ((jerarquia[text(datosPromo.nivelRequerido, 30)] || 1) > rango.numero) {
        return NextResponse.json({ error: `Esta promoción requiere nivel ${text(datosPromo.nivelRequerido, 30)}.` }, { status: 409 });
      }
      if (datosPromo.tipo === "Cumpleaños" && !esCumple) {
        return NextResponse.json({ error: "Esta promoción sólo es válida el día del cumpleaños." }, { status: 409 });
      }
      if (datosPromo.fechaVencimiento && String(datosPromo.fechaVencimiento) < new Date().toISOString().slice(0, 10)) {
        return NextResponse.json({ error: "La promoción ya venció." }, { status: 409 });
      }
      const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const hoy = dias[new Date().getDay()];
      const finDeSemana = hoy === "Sábado" || hoy === "Domingo";
      const diasValidos = text(datosPromo.diasValidos, 40);
      const diaBloqueado =
        (diasValidos === "Fines de semana" && !finDeSemana) ||
        (diasValidos === "Lunes a Viernes" && finDeSemana) ||
        (diasValidos.startsWith("Solo ") && diasValidos !== `Solo ${hoy}`);
      if (diaBloqueado) {
        return NextResponse.json({ error: `La promoción es válida únicamente: ${diasValidos}.` }, { status: 409 });
      }
      const meta = Number(datosPromo.visitasMeta);
      if (datosPromo.tipo === "Frecuente" && Number.isFinite(meta) && meta > recientes.length) {
        return NextResponse.json({ error: `Faltan ${meta - recientes.length} visita(s) para desbloquear este beneficio.` }, { status: 409 });
      }
      if (datosPromo.tipo === "Directa" && datosPromo.usoUnico && recientes.some((visita) => visita.data().idPromo === promo.id)) {
        return NextResponse.json({ error: "Este beneficio de uso único ya fue utilizado." }, { status: 409 });
      }
      nombrePromo = text(datosPromo.titulo) || "Promoción";
    }

    const visita = await adminDb.collection("visitas").add({
      ownerUid: actor.uid,
      youthUid: tarjeta.uid,
      idNegocio: actor.uid,
      nombreNegocio: text(actor.negocio.nombreComercial),
      idPromo: promoId || "ninguna",
      nombrePromo,
      fecha: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, visitaId: visita.id });
  } catch (error: any) {
    console.error("Validación de Tarjeta Joven:", error);
    if (error?.message === "NO_AUTH" || error?.message === "NO_BUSINESS") {
      return NextResponse.json({ error: "Sesión de negocio no autorizada." }, { status: 403 });
    }
    if (error?.message === "QR_INVALIDO") {
      return NextResponse.json({ error: "No encontramos una Tarjeta Joven activa con ese QR." }, { status: 404 });
    }
    return NextResponse.json({ error: "No fue posible validar la tarjeta. Inténtalo nuevamente." }, { status: 500 });
  }
}
