"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

export default function LoginRegistroNegocios() {
  const router = useRouter();
  const [vista, setVista] = useState("login"); // 'login' o 'registro'
  const [cargando, setCargando] = useState(false);

  // Estados Login
  const [correoLogin, setCorreoLogin] = useState("");
  const [passLogin, setPassLogin] = useState("");

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

  const procesarImagen = (e: React.ChangeEvent<HTMLInputElement>, tipo: "logo" | "evidencia") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evento) => {
        if (evento.target?.result) {
          const img = new Image();
          img.src = evento.target.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 500; const MAX_HEIGHT = 500;
            let width = img.width; let height = img.height;
            if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
            else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0, width, height);
            const resultado = canvas.toDataURL("image/jpeg", 0.8);
            if(tipo === "logo") setLogoBase64(resultado);
            else setEvidenciaBase64(resultado);
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const q = query(collection(db, "negocios"), where("correo", "==", correoLogin.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        let accesoConcedido = false;
        let datosNegocio = null;
        snap.forEach((doc) => {
          if (doc.data().contrasena === passLogin) {
            accesoConcedido = true;
            datosNegocio = { idFirebase: doc.id, ...doc.data() };
          }
        });

        if (accesoConcedido && datosNegocio) {
          if ((datosNegocio as any).estatus === "Pendiente") {
             alert("⏳ Tu solicitud aún está en revisión por el Instituto. Te notificaremos por correo cuando sea aprobada.");
          } else {
             localStorage.setItem("sesionNegocio", JSON.stringify(datosNegocio));
             router.push("/portal-negocios");
          }
        } else {
          alert("❌ Contraseña incorrecta.");
        }
      } else {
        alert("❌ Este correo no está registrado como negocio aliado.");
      }
    } catch (error) {
      alert("Hubo un error al iniciar sesión.");
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
      const q = query(collection(db, "negocios"), where("correo", "==", correoReg.trim()));
      if (!(await getDocs(q)).empty) { alert("¡Ese correo ya está registrado en el sistema!"); setCargando(false); return; }

      // Subir imágenes a Storage
      let urlLogo = logoBase64;
      let urlEvidencia = evidenciaBase64;
      
      const logoRef = ref(storage, `negocios_logos/${Date.now()}_logo.jpg`);
      await uploadString(logoRef, logoBase64, 'data_url');
      urlLogo = await getDownloadURL(logoRef);

      const evidenciaRef = ref(storage, `negocios_evidencias/${Date.now()}_evidencia.jpg`);
      await uploadString(evidenciaRef, evidenciaBase64, 'data_url');
      urlEvidencia = await getDownloadURL(evidenciaRef);

      // Crear contraseña temporal
      const passwordTemporal = "ALIADO-" + Math.floor(Math.random() * 900000 + 100000);

      await addDoc(collection(db, "negocios"), {
        nombreComercial: nombre.trim(), giro: giro.trim(), correo: correoReg.trim(),
        contrasena: passwordTemporal, logo: urlLogo, evidenciaFachada: urlEvidencia, 
        lat: lat, lng: lng, horario: horario.trim(), telefono: telefono.trim(),
        estatus: "Pendiente", fechaRegistro: new Date().toISOString(),
        aceptoTerminos: true // Registro legal en base de datos
      });

      alert("✅ ¡Solicitud enviada con éxito! El IMJU revisará tu información y la evidencia fotográfica. Recibirás un correo de confirmación con tus accesos en cuanto sea aprobada.");
      
      // Limpiar formulario y regresar al login
      setNombre(""); setGiro(""); setHorario(""); setTelefono(""); setCorreoReg("");
      setLogoBase64(null); setEvidenciaBase64(null); setAceptaTerminos(false);
      setVista("login");
      
    } catch (error) { alert("Error al enviar la solicitud."); console.error(error); }
    setCargando(false);
  };

  return (
    <main className="min-h-screen bg-[#F3F5F9] font-sans selection:bg-emerald-500/30">
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
                     Declaro que la información es verídica. He leído y acepto los <a href="/aviso-de-privacidad" target="_blank" className="text-emerald-700 font-bold underline">Términos, Condiciones y Aviso de Privacidad</a>. Comprendo que mi negocio es el <strong>único responsable legal y comercial</strong> de las promociones y ofertas de empleo publicadas en esta plataforma, deslindando al IMJU de toda responsabilidad.
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
