import { NextResponse } from "next/server";
import { adminDb, assertAdminEnv } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const texto = (valor: unknown, max = 180) => typeof valor === "string" ? valor.trim().slice(0, max) : "";
const enlaceSeguro = (valor: unknown) => typeof valor === "string" && valor.startsWith("https://") ? valor : null;

export async function GET() {
  try {
    assertAdminEnv();
    const snapshot = await adminDb.collection("negocios").where("estatus", "==", "Activo").limit(250).get();
    const negocios = snapshot.docs.map((documento) => {
      const datos = documento.data();
      return {
        idFirebase: documento.id,
        nombreComercial: texto(datos.nombreComercial),
        giro: texto(datos.giro, 100),
        horario: texto(datos.horario),
        telefono: texto(datos.telefono, 30).replace(/[^0-9+]/g, ""),
        lat: Number.isFinite(Number(datos.lat)) ? Number(datos.lat) : null,
        lng: Number.isFinite(Number(datos.lng)) ? Number(datos.lng) : null,
        logo: enlaceSeguro(datos.logo),
        menuImagen: enlaceSeguro(datos.menuImagen),
      };
    });

    return NextResponse.json({ negocios }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Directorio público:", error);
    return NextResponse.json({ error: "No fue posible cargar el directorio." }, { status: 503 });
  }
}
