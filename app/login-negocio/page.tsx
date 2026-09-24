"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth, authPersistenceReady } from "../../firebase";
import { normalizarCorreo } from "@/lib/credenciales";
import { compressImageDataUrl, readFileAsDataUrl } from "@/lib/client-image";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

export default function LoginRegistroNegocios() {
  const router = useRouter();
  const [vista, setVista] = useState("login"); // 'login' o 'registro'
  const [cargando, setCargando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  // Estados Login
  const [correoLogin, setCorreoLogin] = useState("");
  const [passLogin, setPassLogin] = useState("");
  const [recuperando, setRecuperando] = useState(false);

  // Estados Registro
  const centroElota = { lat: 23.92173, lng: -106.89264 };
  const [nombre, setNombre] = useState("");
  const [giro, setGiro] = useState("");
  const [horario, setHorario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correoReg, setCorreoReg] = useState("");
  const [lat, setLat] = useState(centroElota.lat);
  const [lng, setLng] = useState(centroElota.lng);
  
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [evidenciaBase64, setEvidenciaBase64] = useState<string | null>(null);
  
  // NUEVO: Estado para Términos y Condiciones
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  const procesarImagen = async (e: React.ChangeEvent<HTMLInputElement>, tipo: "logo" | "evidencia") => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const source = await readFileAsDataUrl(file);
        const result = await compressImageDataUrl(source, tipo === "logo" ? "businessLogo" : "facade");
        if (tipo === "logo") setLogoBase64(result);
        else setEvidenciaBase64(result);
      } catch (error: any) {
        alert(error?.message || "No pudimos optimizar la imagen.");
      }
    }
  };

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      await authPersistenceReady;
      await signInWithEmailAndPassword(auth, normalizarCorreo(correoLogin), passLogin);
      router.push("/portal-negocios");
    } catch (error) {
      console.error("Inicio de sesión negocio:", error);
      alert("No pudimos iniciar sesión. Revisa tus datos o espera el correo de aprobación si tu solicitud sigue en revisión.");
    }
    setCargando(false);
  };

  const enviarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !giro || !horario || !telefono || !correoReg) { alert("Llena todos los campos de texto."); return; }
    if (!logoBase64) { alert("Por favor, sube el logotipo de tu negocio."); return; }
    if (!evidenciaBase64) { alert("Por favor, sube la foto de evidencia exterior del local."); return; }
    if (!aceptaTerminos) { alert("Debes aceptar los Términos y Condiciones para continuar."); return; } // Validación legal

    setCargando(true);
    try {
      const payload = JSON.stringify({
        tipo: "negocio",
        nombreComercial: nombre.trim(),
        giro: giro.trim(),
        correo: normalizarCorreo(correoReg),
        logo: logoBase64,
        evidenciaFachada: evidenciaBase64,
        lat,
        lng,
        horario: horario.trim(),
        telefono: telefono.trim(),
        aceptoTerminos: true,
      });
      if (new Blob([payload]).size > 3_800_000) {
        throw new Error("Las imágenes pesan demasiado. Selecciona imágenes más ligeras e inténtalo nuevamente.");
      }

      const response = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      const rawResult = await response.text();
      const result = (() => { try { return JSON.parse(rawResult); } catch { return {}; } })();
      if (response.status === 413) throw new Error("Las imágenes exceden el tamaño permitido. Selecciona imágenes más ligeras.");
      if (!response.ok) throw new Error(result.error || "No fue posible enviar la solicitud.");

      setRegistroExitoso(true);
      
      // Limpiar formulario y regresar al login
      setNombre(""); setGiro(""); setHorario(""); setTelefono(""); setCorreoReg("");
      setLogoBase64(null); setEvidenciaBase64(null); setAceptaTerminos(false);
      
    } catch (error: any) {
      console.error("Error registrando negocio:", error);
      alert(`No fue posible enviar la solicitud: ${error?.message || "error desconocido"}`);
    }
    setCargando(false);
  };

  return (
    <main className="app-shell motion-enter min-h-screen bg-[#F3F5F9] font-sans selection:bg-emerald-500/30">
      {registroExitoso && (
        <div className="fixed inset-0 z-[300] grid place-items-center bg-slate-950/75 p-6 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white p-8 text-center shadow-2xl">
            <div className="brand-orb absolute -left-16 -top-16 h-44 w-44 rounded-full bg-emerald-300/30 blur-3xl"></div>
            <div className="relative mx-auto mb-5 grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-emerald-400 to-cyan-500 text-5xl shadow-xl shadow-emerald-200">🚀</div>
            <p className="text-[10px] font-black uppercase tracking-[.3em] text-emerald-600">Nuevo aliado en camino</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">¡Solicitud recibida!</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">Revisaremos el negocio y su evidencia. Al aprobarse llegará un enlace seguro para crear la contraseña del portal.</p>
            <button onClick={() => { setRegistroExitoso(false); setVista("login"); }} className="mt-7 w-full rounded-2xl bg-emerald-600 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95">Entendido, ir al acceso</button>
          </div>
        </div>
      )}
      <div className="flex min-h-screen">
        
        {/* LADO IZQUIERDO: DECORATIVO */}
        <div className="hidden lg:flex w-1/2 bg-emerald-900 relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-800 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          
          <div className="relative z-10 text-center px-12 text-white">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
               <span className="text-5xl">🏪</span>
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tight">Red de Aliados IMJU</h1>
            <p className="text-lg text-emerald-100/80 font-medium max-w-md mx-auto leading-relaxed">Únete a Tarjeta Joven Elota, atrae nuevos clientes y fortalece la economía local.</p>
          </div>
        </div>

        {/* LADO DERECHO: FORMULARIOS */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative h-screen overflow-y-auto">
          <div className="w-full max-w-md animate-slide-up pb-10">
            
            <div className="text-center mb-10 lg:hidden">
               <div className="w-16 h-16 bg-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🏪</span></div>
               <h1 className="text-2xl font-black text-slate-900 tracking-tight">Portal Negocios</h1>
            </div>

            <div className="bg-slate-100 p-1.5 rounded-2xl mb-8 flex shadow-inner">
               <button onClick={() => setVista("login")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vista === "login" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Ingresar</button>
               <button onClick={() => setVista("registro")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vista === "registro" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Quiero ser Aliado</button>
            </div>

            {vista === "login" ? (
              <form onSubmit={iniciarSesion} className="animate-fade-in space-y-5">
                <input type="email" value={correoLogin} onChange={e => setCorreoLogin(e.target.value)} placeholder="Correo del Negocio" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all shadow-sm" required />
                <input type="password" value={passLogin} onChange={e => setPassLogin(e.target.value)} placeholder="Contraseña de Acceso" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all shadow-sm" required />
                <button type="submit" disabled={cargando} className={`w-full font-black py-5 rounded-[1.5rem] text-[11px] uppercase tracking-widest transition-all shadow-xl mt-4 ${cargando ? "bg-slate-400 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-95"}`}>
                  {cargando ? "Verificando..." : "Acceder al Portal"}
                </button>
                <button type="button" disabled={recuperando || !correoLogin} onClick={async () => {
                  setRecuperando(true);
                  try {
                    await sendPasswordResetEmail(auth, normalizarCorreo(correoLogin));
                    alert("Si tu negocio ya fue aprobado, recibirás un enlace seguro para crear una nueva contraseña.");
                  } catch (error) {
                    console.error(error);
                    alert("No fue posible enviar el enlace. Verifica el correo.");
                  } finally { setRecuperando(false); }
                }} className="w-full text-xs font-black text-emerald-700 hover:text-emerald-900 disabled:opacity-40">
                  {recuperando ? "Enviando enlace..." : "¿Olvidaste tu contraseña?"}
                </button>
              </form>
            ) : (
              <form onSubmit={enviarSolicitud} className="animate-fade-in space-y-5">
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mb-6">
                   <p className="text-[11px] font-bold text-emerald-800 leading-relaxed">Completa este formulario. El Instituto validará tu negocio y te enviará tu clave de acceso por correo electrónico.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-300 transition-colors">
                    <img src={logoBase64 || "/imju-elota.webp"} className={`w-16 h-16 rounded-xl object-contain mb-3 ${!logoBase64 && 'opacity-30'}`} />
                    <label className="text-[9px] bg-emerald-50 text-emerald-700 font-black uppercase tracking-widest px-4 py-2 rounded-lg cursor-pointer text-center w-full">
                       {logoBase64 ? "Cambiar Logo" : "Subir Logotipo"}
                       <input type="file" accept="image/*" onChange={(e) => procesarImagen(e, "logo")} className="hidden" />
                    </label>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-300 transition-colors">
                    <img src={evidenciaBase64 || "/imju-elota.webp"} className={`w-16 h-16 rounded-xl object-cover mb-3 ${!evidenciaBase64 && 'opacity-30'}`} />
                    <label className="text-[9px] bg-slate-50 text-slate-700 font-black uppercase tracking-widest px-4 py-2 rounded-lg cursor-pointer text-center w-full">
                       {evidenciaBase64 ? "Cambiar Foto" : "Foto Fachada (Evidencia)"}
                       <input type="file" accept="image/*" onChange={(e) => procesarImagen(e, "evidencia")} className="hidden" />
                    </label>
                  </div>
                </div>

                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre Comercial" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-sm" required />
                <input type="text" value={giro} onChange={e => setGiro(e.target.value)} placeholder="Giro (Ej. Cafetería, Barbería)" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-sm" required />
                
                <div className="grid grid-cols-2 gap-4">
                   <input type="text" value={horario} onChange={e => setHorario(e.target.value)} placeholder="Horario (Lun-Sab 9a6)" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-sm" required />
                   <input type="number" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="WhatsApp Contacto" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-sm" required />
                </div>
                
                <input type="email" value={correoReg} onChange={e => setCorreoReg(e.target.value)} placeholder="Correo Electrónico (Será tu usuario)" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-sm" required />

                <div className="pt-2">
                   <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">Ubicación GPS Exacta</label>
                   <div className="w-full h-40 rounded-[1.5rem] overflow-hidden border-2 border-slate-200 relative z-0 shadow-sm">
                      <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[lat, lng]} draggable={true} eventHandlers={{ dragend: (e) => { const marker = e.target; const position = marker.getLatLng(); setLat(position.lat); setLng(position.lng); } }} />
                      </MapContainer>
                   </div>
                   <p className="text-[9px] text-slate-400 mt-1.5 text-center font-bold">Mueve el pin azul a la dirección exacta de tu local.</p>
                </div>

                {/* CASILLA LEGAL OBLIGATORIA */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3 mt-4">
                   <input type="checkbox" id="terminos" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                   <label htmlFor="terminos" className="text-[10px] text-slate-600 font-medium leading-relaxed">
                     Declaro que la información es verídica. He leído y acepto los <a href="/aviso-de-privacidad" target="_blank" className="text-emerald-700 font-bold underline">Términos, Condiciones y Aviso de Privacidad</a>. Comprendo que la evidencia de fachada se utilizará sólo para validar la solicitud y se eliminará al aprobarla o rechazarla. Mi negocio es el <strong>único responsable legal y comercial</strong> de las promociones y ofertas de empleo publicadas en esta plataforma, deslindando al IMJU de toda responsabilidad.
                   </label>
                </div>

                <button type="submit" disabled={cargando} className={`w-full font-black py-5 rounded-[1.5rem] text-[11px] uppercase tracking-widest transition-all shadow-xl mt-2 ${cargando ? "bg-slate-400 text-white" : "bg-slate-900 hover:bg-black text-white shadow-slate-900/30 active:scale-95"}`}>
                  {cargando ? "Enviando Solicitud..." : "Enviar Solicitud al IMJU"}
                </button>
              </form>
            )}
            
            <div className="mt-8 text-center"><button onClick={() => router.push("/")} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-700 transition-colors">← Volver al Inicio</button></div>
          </div>
        </div>
      </div>
    </main>
  );
}
