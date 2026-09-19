"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth, authPersistenceReady } from "../../firebase";
import Link from "next/link";
import { Camera, type CameraHandle } from "@/components/NativeCamera";
import { normalizarCorreo } from "@/lib/credenciales";

export default function LoginJoven() {
  const [vistaActual, setVistaActual] = useState("login"); 
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  const [regNombre, setRegNombre] = useState("");
  const [regFechaNac, setRegFechaNac] = useState("");
  const [regCorreo, setRegCorreo] = useState("");
  const [regGenero, setRegGenero] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [docBase64, setDocBase64] = useState<string | null>(null); 
  const [docFile, setDocFile] = useState<File | null>(null);

  const [camaraActiva, setCamaraActiva] = useState<"perfil" | "documento" | null>(null);
  const [camaraFrontal, setCamaraFrontal] = useState(true); 
  const cameraRef = useRef<CameraHandle>(null);

  const router = useRouter();

  useEffect(() => {
    if (auth.currentUser) {
      router.push("/tarjeta");
    }
  }, [router]);

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !password) { alert("Por favor, llena ambos campos."); return; }
    setCargando(true);

    try {
      await authPersistenceReady;
      await signInWithEmailAndPassword(auth, normalizarCorreo(correo), password);
      router.push("/tarjeta");
    } catch (error: any) {
      console.error("Inicio de sesión joven:", error);
      alert("No pudimos iniciar sesión. Revisa tus datos o espera el correo de aprobación si tu solicitud sigue en revisión.");
    }
    setCargando(false);
  };

  const recuperarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correoRecuperacion) { alert("Ingresa tu correo."); return; }
    setEnviandoCorreo(true);

    try {
      await sendPasswordResetEmail(auth, normalizarCorreo(correoRecuperacion));
      alert("¡Listo! Si tu cuenta ya fue aprobada, recibirás un enlace seguro para crear una nueva contraseña.");
      setVistaActual("login"); setCorreoRecuperacion("");
    } catch (error) {
      console.error("Recuperación:", error);
      alert("No fue posible enviar el enlace. Verifica el correo e inténtalo nuevamente.");
    }
    setEnviandoCorreo(false);
  };

  const abrirCamara = (tipo: "perfil" | "documento") => { setCamaraActiva(tipo); setCamaraFrontal(tipo === "perfil"); };
  const capturarFoto = () => { const fotoStr = cameraRef.current?.takePhoto(); if (fotoStr) procesarImagen(fotoStr, camaraActiva!); };

  const procesarImagen = (fuenteImagen: string, destino: "perfil" | "documento") => {
    const img = new Image(); img.src = fuenteImagen;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = destino === "perfil" ? 400 : 800; const MAX_HEIGHT = destino === "perfil" ? 400 : 800;
      let width = img.width; let height = img.height;
      if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
      else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0, width, height);
      const resultado = canvas.toDataURL("image/jpeg", destino === "perfil" ? 0.8 : 0.9);
      if (destino === "perfil") { setFotoBase64(resultado); } else { setDocBase64(resultado); setDocFile(null); }
      setCamaraActiva(null);
    };
  };

  const manejarSubidaArchivoFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (ev) => { if (ev.target?.result) procesarImagen(ev.target.result as string, "perfil"); }; reader.readAsDataURL(file); }
  };

  const manejarSubidaArchivoDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) { const reader = new FileReader(); reader.onload = (ev) => { if (ev.target?.result) procesarImagen(ev.target.result as string, "documento"); }; reader.readAsDataURL(file); } 
      else { setDocFile(file); setDocBase64(null); }
    }
  };

  const calcularEdad = (fechaNac: string) => {
    const hoy = new Date(); const cumple = new Date(fechaNac);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
    return edad;
  };

  const registrarJoven = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre || !regFechaNac || !regCorreo) { alert("Completa tu nombre, fecha de nacimiento y correo."); return; }
    const edad = calcularEdad(regFechaNac);
    if (edad < 12 || edad > 29) { alert(`❌ El reglamento establece que la Tarjeta Joven es para personas de 12 a 29 años. Tu edad calculada es ${edad} años.`); return; }
    if (!regGenero) { alert("Por favor, selecciona tu género en el Paso 1."); return; }
    if (!fotoBase64) { alert("Falta el PASO 2: Tómate o sube una fotografía para tu perfil."); return; }
    if (!docBase64 && !docFile) { alert("Falta el PASO 3: Tómate foto o sube un documento que compruebe tu identidad."); return; }

    setRegistrando(true);
    try {
      let documento = docBase64;
      if (!documento && docFile) {
        if (docFile.size > 2_500_000) throw new Error("El PDF debe pesar menos de 2.5 MB.");
        documento = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(docFile);
        });
      }

      const response = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "joven",
          nombreCompleto: regNombre.trim(),
          fechaNacimiento: regFechaNac,
          genero: regGenero,
          correo: normalizarCorreo(regCorreo),
          fotoPerfil: fotoBase64,
          documentoProbatorio: documento,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No fue posible guardar la solicitud.");

      setRegistroExitoso(true);
      setRegNombre(""); setRegFechaNac(""); setRegCorreo(""); setRegGenero("");
      setFotoBase64(null); setDocBase64(null); setDocFile(null);

    } catch (error: any) {
      console.error("Error registrando joven:", error);
      alert(`No fue posible enviar tu registro: ${error?.message || "error desconocido"}`);
    }
    setRegistrando(false);
  };

  return (
    <main className="app-shell motion-enter flex min-h-screen flex-col items-center justify-center bg-[#F3F5F9] dark:bg-slate-900 p-4 md:p-6 relative font-sans transition-colors">
      {registroExitoso && (
        <div className="fixed inset-0 z-[300] grid place-items-center bg-slate-950/75 p-6 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white p-8 text-center shadow-2xl">
            <div className="brand-orb absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-300/30 blur-3xl"></div>
            <div className="relative mx-auto mb-5 grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-orange-400 to-pink-500 text-5xl shadow-xl shadow-orange-200">🏆</div>
            <p className="text-[10px] font-black uppercase tracking-[.3em] text-orange-600">Misión completada</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">¡Solicitud enviada!</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">El equipo del IMJU revisará tus datos. Cuando te aprueben recibirás un enlace para crear tu contraseña y activar tu QR único.</p>
            <button onClick={() => { setRegistroExitoso(false); setVistaActual("login"); }} className="mt-7 w-full rounded-2xl bg-slate-900 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95">Entendido, ir al acceso</button>
          </div>
        </div>
      )}
      
      {/* LÍNEA INSTITUCIONAL SUPERIOR */}
      <div className="absolute top-0 left-0 w-full h-1.5 flex">
        <div className="w-1/3 h-full bg-[#D65F08]"></div>
        <div className="w-1/3 h-full bg-white"></div>
        <div className="w-1/3 h-full bg-[#F57C00]"></div>
      </div>

      {camaraActiva && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col justify-center animate-fade-in">
          {camaraActiva === "documento" && (
            <div className="absolute top-12 left-0 w-full z-50 px-6 text-center animate-pulse">
              <div className="bg-[#F57C00] text-white px-5 py-3 rounded-2xl shadow-2xl inline-block border-2 border-orange-300">
                <p className="font-black uppercase tracking-widest text-xs mb-1">⚠️ IMPORTANTE</p>
                <p className="text-[11px] font-bold">Enfoca bien. Asegúrate de que el texto sea completamente legible y haya buena luz.</p>
              </div>
            </div>
          )}
          <div className="relative w-full h-[70vh] max-h-[600px] overflow-hidden bg-slate-900 border-y-2 border-slate-700">
             {/* @ts-ignore */}
             <Camera ref={cameraRef} facingMode={camaraFrontal ? "user" : "environment"} errorMessages={{ noCameraAccessible: 'Sin cámara', permissionDenied: 'Sin permiso', switchCamera: 'Error', canvas: 'Error' }} />
          </div>
          <div className="absolute bottom-0 left-0 w-full bg-black pb-12 pt-6 px-6 flex justify-around items-center z-50">
             <button type="button" onClick={() => setCamaraActiva(null)} className="text-slate-400 font-bold uppercase tracking-widest text-[10px] w-20 text-center">Cancelar</button>
             <button type="button" onClick={capturarFoto} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center transition-transform active:scale-90"></button>
             <button type="button" onClick={() => setCamaraFrontal(!camaraFrontal)} className="text-white font-bold uppercase tracking-widest text-[10px] w-20 text-center bg-slate-800 py-3 rounded-xl border border-slate-600">🔄 Girar</button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden relative">
        
        {/* VISTA LOGIN */}
        <div className={`p-8 w-full ${vistaActual === "login" ? "block animate-fade-in" : "hidden"}`}>
          <div className="text-center mb-8 mt-2">
            <h2 className="text-3xl font-black text-[#D65F08] dark:text-orange-400 tracking-tight">Tarjeta Joven Elota</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs font-medium">Ingresa a tu portal personal</p>
          </div>
          <form onSubmit={iniciarSesion} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 pl-1">Correo Electrónico</label>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#F57C00] transition-colors" placeholder="tu@correo.com" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 pl-1">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#F57C00] transition-colors" placeholder="Tu contraseña o código IMJU" />
            </div>
            <button type="submit" disabled={cargando} className={`w-full text-white font-black text-xs uppercase tracking-widest py-4 px-4 rounded-2xl transition-all shadow-lg mt-2 ${cargando ? "bg-slate-400" : "bg-[#F57C00] hover:bg-orange-600 shadow-orange-500/20"}`}>
              {cargando ? "Verificando..." : "Entrar a mi Tarjeta"}
            </button>
          </form>
          <div className="mt-6 text-center space-y-3 flex flex-col pt-5 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => setVistaActual("registro")} type="button" className="text-[11px] text-[#D65F08] dark:text-orange-400 hover:text-slate-900 font-black uppercase tracking-widest bg-orange-50 dark:bg-orange-950/30 py-3.5 rounded-2xl border border-orange-100 dark:border-orange-900/50 transition-colors">Crear nueva cuenta</button>
            <button onClick={() => setVistaActual("recuperacion")} type="button" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#D65F08] font-bold transition-colors">¿Olvidaste tu contraseña?</button>
            <Link href="/" className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 font-medium pt-2">← Volver al inicio</Link>
          </div>
        </div>

        {/* VISTA RECUPERACIÓN */}
        <div className={`p-8 w-full ${vistaActual === "recuperacion" ? "block animate-fade-in" : "hidden"}`}>
          <div className="text-center mb-6 mt-2">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/40 text-[#F57C00] rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-orange-100 dark:border-orange-900">🔐</div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Recuperar Acceso</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs font-medium leading-relaxed">Ingresa el correo con el que te registraste.</p>
          </div>
          <form onSubmit={recuperarContrasena} className="space-y-4">
            <input type="email" value={correoRecuperacion} onChange={(e) => setCorreoRecuperacion(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3.5 text-center text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#F57C00]" placeholder="tu@correo.com" required />
            <button type="submit" disabled={enviandoCorreo} className={`w-full text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-lg ${enviandoCorreo ? "bg-slate-400" : "bg-[#D65F08] dark:bg-orange-700 hover:bg-slate-900"}`}>
              {enviandoCorreo ? "Buscando..." : "Enviar correo de rescate"}
            </button>
          </form>
          <div className="mt-6 text-center pb-2"><button onClick={() => setVistaActual("login")} className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#D65F08] font-bold">Cancelar y volver</button></div>
        </div>

        {/* VISTA REGISTRO */}
        <div className={`p-6 md:p-8 w-full ${vistaActual === "registro" ? "block animate-fade-in" : "hidden"}`}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">Solicitud de Registro</h2>
            <p className="text-[#D65F08] dark:text-orange-400 mt-1.5 text-[10px] font-black uppercase tracking-widest bg-orange-50 dark:bg-orange-950/40 inline-block px-3.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/50">Exclusivo de 12 a 29 años</p>
          </div>
          
          <form onSubmit={registrarJoven} className="space-y-5">
            
            <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-3xl border border-slate-200/70 dark:border-slate-700 space-y-3.5">
               <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-widest border-b border-slate-200/60 dark:border-slate-600 pb-2">Paso 1: Datos Personales</h3>
               <div>
                 <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 mb-1">Nombre Completo</label>
                 <input type="text" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-[#F57C00]" required />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 mb-1">Fecha de Nacimiento</label>
                 <input type="date" value={regFechaNac} onChange={(e) => setRegFechaNac(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-300 outline-none focus:border-[#F57C00]" required />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 mb-1">Género</label>
                 <select value={regGenero} onChange={(e) => setRegGenero(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-[#F57C00]" required>
                   <option value="">Selecciona tu género...</option>
                   <option value="Mujer">Mujer</option>
                   <option value="Hombre">Hombre</option>
                   <option value="No Binario">No Binario</option>
                   <option value="Prefiero no decir">Prefiero no decir</option>
                 </select>
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 mb-1">Correo Electrónico</label>
                 <input type="email" value={regCorreo} onChange={(e) => setRegCorreo(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-[#F57C00]" required />
               </div>
            </div>

            <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 p-5 rounded-3xl text-center shadow-sm">
               <h3 className="text-[10px] font-black uppercase text-orange-800 dark:text-orange-400 tracking-widest mb-1">📸 Paso 2: Tu Foto de Perfil</h3>
               <p className="text-[10px] text-orange-600/80 dark:text-orange-400/80 font-medium mb-3 leading-tight">Debe ser de frente, iluminada, sin lentes oscuros ni gorras.</p>
               {!fotoBase64 ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => abrirCamara("perfil")} className="flex-1 bg-[#F57C00] hover:bg-orange-600 text-white font-bold py-3 rounded-2xl shadow-sm text-[10px] uppercase tracking-widest flex items-center justify-center gap-1">📷 Selfie</button>
                    <label className="flex-1 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-400 font-bold py-3 rounded-2xl cursor-pointer text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center">
                        📁 Galería <input type="file" accept="image/*" onChange={manejarSubidaArchivoFoto} className="hidden" />
                    </label>
                  </div>
               ) : (
                  <div className="flex flex-col items-center">
                     <img src={fotoBase64} alt="Selfie" className="w-20 h-20 object-cover rounded-full border-4 border-[#F57C00] mb-2 shadow-md" />
                     <button type="button" onClick={() => setFotoBase64(null)} className="text-[9px] bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-bold px-4 py-1.5 rounded-xl border border-orange-200 dark:border-orange-900 uppercase tracking-widest">Cambiar Foto</button>
                  </div>
               )}
            </div>

            <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 p-5 rounded-3xl text-center shadow-sm">
               <h3 className="text-[10px] font-black uppercase text-[#D65F08] dark:text-orange-400 tracking-widest mb-1">📄 Paso 3: Identidad</h3>
               <p className="text-[10px] text-orange-700/80 dark:text-orange-300/80 font-medium mb-3 leading-tight">INE, Acta de Nacimiento o Credencial Escolar.</p>
               {(!docBase64 && !docFile) ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => abrirCamara("documento")} className="flex-1 bg-[#D65F08] dark:bg-orange-700 hover:bg-slate-900 text-white font-bold py-3 rounded-2xl shadow-sm text-[10px] uppercase tracking-widest flex items-center justify-center gap-1">📷 Tomar Foto</button>
                    <label className="flex-1 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900 text-[#D65F08] dark:text-orange-400 font-bold py-3 rounded-2xl cursor-pointer text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center">
                        📁 Archivo <input type="file" accept="image/*,.pdf" onChange={manejarSubidaArchivoDoc} className="hidden" />
                    </label>
                  </div>
               ) : (
                  <div className="flex flex-col items-center bg-white dark:bg-slate-800 p-3 rounded-2xl border border-orange-200 dark:border-orange-900">
                     <span className="text-xl mb-0.5">✅</span>
                     <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 mb-1">Documento Listo</p>
                     <button type="button" onClick={() => {setDocBase64(null); setDocFile(null)}} className="text-[9px] text-red-500 dark:text-red-400 font-bold uppercase tracking-widest underline">Quitar y volver a subir</button>
                  </div>
               )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="w-4 h-4 mt-0.5 accent-[#D65F08] cursor-pointer rounded shrink-0" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  He leído y acepto el <Link href="/aviso-de-privacidad" target="_blank" className="text-[#D65F08] dark:text-orange-400 font-bold underline">Aviso de Privacidad</Link> del IMJU Elota.
                </span>
              </label>
            </div>

            <button type="submit" disabled={registrando} className={`w-full text-white font-black py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-[11px] ${registrando ? "bg-slate-400 cursor-not-allowed" : "bg-[#D65F08] dark:bg-orange-700 hover:bg-slate-900 shadow-orange-900/20 active:scale-95"}`}>
              {registrando ? "Enviando Solicitud..." : "Enviar a Revisión"}
            </button>
          </form>

          <div className="mt-6 text-center pb-2">
            <button onClick={() => setVistaActual("login")} className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#D65F08] dark:hover:text-orange-400 font-bold transition-colors">
              Ya tengo cuenta, Iniciar Sesión
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
