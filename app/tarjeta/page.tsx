"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/navigation";
import { doc, collection, getDocs, limit, query, where, getDoc } from "firebase/firestore"; 
import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, signOut, updatePassword } from "firebase/auth";
import { auth, db } from "../../firebase";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

const INSTAGRAM_URL = "https://www.instagram.com/imjuelotamx?stkn=M24xYzdweDVzMDI3";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100075974077385";

export default function TarjetaDigital() {
  const [datosJoven, setDatosJoven] = useState<any>(null);
  const [pestañaActiva, setPestañaActiva] = useState("promos"); 
  const [filtroTipoPromo, setFiltroTipoPromo] = useState("todos"); 
  
  const [qrAmpliado, setQrAmpliado] = useState(false);
  const [listaPromos, setListaPromos] = useState<any[]>([]);
  const [listaEmpleos, setListaEmpleos] = useState<any[]>([]);
  const [miHistorial, setMiHistorial] = useState<any[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modoOscuro, setModoOscuro] = useState(false);
  const [empleosContactados, setEmpleosContactados] = useState<string[]>([]);

  const [listaNegocios, setListaNegocios] = useState<any[]>([]);
  const [vistaDirectorio, setVistaDirectorio] = useState("lista"); 
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<any>(null);

  const [modalNivel, setModalNivel] = useState<{mostrar: boolean, nivelNuevo: string, visitas: number} | null>(null);
  const [modalAjustes, setModalAjustes] = useState(false);
  
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [avisos, setAvisos] = useState<any[]>([]); 
  const [modalAvisos, setModalAvisos] = useState(false);
  const [avisosNoLeidos, setAvisosNoLeidos] = useState(0);
  const [misionesCompletadas, setMisionesCompletadas] = useState<string[]>([]);
  const [modalRutaCompletada, setModalRutaCompletada] = useState(false);
  const [modalMisiones, setModalMisiones] = useState(false);
  const [notificacionMision, setNotificacionMision] = useState<{titulo: string, recompensa: string} | null>(null);

  const router = useRouter();
  const centroElota: [number, number] = [23.92173, -106.89264]; 

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/login"); return; }
      try {
        const youthSnap = await getDoc(doc(db, "jovenes", user.uid));
        if (!youthSnap.exists() || youthSnap.data().estatus !== "Activo") {
          await signOut(auth);
          router.replace("/login");
          return;
        }
        const youth = { idFirebase: youthSnap.id, ...youthSnap.data() };
        setDatosJoven(youth);
        setMisionesCompletadas(JSON.parse(localStorage.getItem(`misiones_joven_${youthSnap.id}`) || "[]"));
        const saved = localStorage.getItem(`empleos_${youthSnap.id}`);
        if (saved) setEmpleosContactados(JSON.parse(saved));
        await cargarTodo(youthSnap.id);
      } catch (error) {
        console.error("Sesión joven:", error);
        await signOut(auth);
        router.replace("/login");
      }
    });

    const temaGuardado = localStorage.getItem("temaTarjeta");
    if (temaGuardado === "dark") setModoOscuro(true);
    return () => unsubscribe();
  }, [router]);

  const cargarTodo = async (idJoven: string) => {
    setCargandoDatos(true);
    try {
      const docRef = doc(db, "sistema", "estado");
      const docSnap = await getDoc(docRef);
      let ultimaActDB = 0;
      
      if (docSnap.exists() && docSnap.data().ultimaActualizacion) {
         ultimaActDB = docSnap.data().ultimaActualizacion;
      }

      const cacheVersionLocal = Number(localStorage.getItem("cache_version") || "0");

      let pTemp: any[] = [];
      let eTemp: any[] = [];
      let nTemp: any[] = [];

      if (ultimaActDB > cacheVersionLocal || cacheVersionLocal === 0) {
        
        const snapPromos = await getDocs(query(collection(db, "promociones"), where("estatus", "==", "Activa"), limit(200)));
        snapPromos.forEach((d) => pTemp.push({ idFirebase: d.id, ...d.data() }));

        const snapEmpleos = await getDocs(query(collection(db, "empleos"), where("estatus", "==", "Activa"), limit(200)));
        snapEmpleos.forEach((d) => eTemp.push({ idFirebase: d.id, ...d.data() }));

        // CORRECCIÓN DIRECTORIO: Carga todos los negocios excepto los "Pendiente"
        const snapNegocios = await getDocs(query(collection(db, "negocios"), where("estatus", "==", "Activo"), limit(250)));
        snapNegocios.forEach((d) => nTemp.push({ idFirebase: d.id, ...d.data() }));

        localStorage.setItem("cache_promos", JSON.stringify(pTemp));
        localStorage.setItem("cache_empleos", JSON.stringify(eTemp));
        localStorage.setItem("cache_negocios", JSON.stringify(nTemp));
        localStorage.setItem("cache_version", ultimaActDB.toString());

      } else {
        pTemp = JSON.parse(localStorage.getItem("cache_promos") || "[]");
        eTemp = JSON.parse(localStorage.getItem("cache_empleos") || "[]");
        nTemp = JSON.parse(localStorage.getItem("cache_negocios") || "[]");
      }

      setListaPromos(pTemp);
      setListaEmpleos(eTemp);
      setListaNegocios(nTemp);

      const qHistorial = query(collection(db, "visitas"), where("youthUid", "==", idJoven), limit(200));
      const snapHistorial = await getDocs(qHistorial);
      const hTemp: any[] = [];
      snapHistorial.forEach((d) => hTemp.push({ idFirebase: d.id, ...d.data() }));
      hTemp.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setMiHistorial(hTemp);
      if (hTemp.length > 0) {
        setMisionesCompletadas((actuales) => {
          if (actuales.includes("primera-visita")) return actuales;
          const nuevas = [...actuales, "primera-visita"];
          localStorage.setItem(`misiones_joven_${idJoven}`, JSON.stringify(nuevas));
          return nuevas;
        });
      }

      const snapAvisos = await getDocs(query(collection(db, "anuncios"), limit(50)));
      const aTemp: any[] = [];
      snapAvisos.forEach((d) => {
        const data = d.data();
        if(data.audiencia === "Todos" || data.audiencia === "Jovenes") {
           aTemp.push({ idFirebase: d.id, ...data });
        }
      });
      aTemp.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setAvisos(aTemp);

      const vistos = JSON.parse(localStorage.getItem("avisosVistosJoven") || "[]");
      const noLeidos = aTemp.filter(a => !vistos.includes(a.idFirebase)).length;
      setAvisosNoLeidos(noLeidos);
      
      if (noLeidos > 0) {
        setModalAvisos(true);
      }

    } catch (error) { console.error(error); }
    setCargandoDatos(false);
  };

  const cerrarModalAvisos = () => {
    const todosIds = avisos.map(a => a.idFirebase);
    localStorage.setItem("avisosVistosJoven", JSON.stringify(todosIds));
    setAvisosNoLeidos(0);
    setModalAvisos(false);
  };

  const ejecutarMision = (id: string, action: () => void, recompensa = "+20 XP") => {
    if (!datosJoven) return;
    const esNueva = !misionesCompletadas.includes(id);
    setMisionesCompletadas((actuales) => {
      const nuevas = actuales.includes(id) ? actuales : [...actuales, id];
      localStorage.setItem(`misiones_joven_${datosJoven.idFirebase}`, JSON.stringify(nuevas));
      return nuevas;
    });
    if (esNueva) setNotificacionMision({ titulo: "Misión completada", recompensa });
    action();
  };

  useEffect(() => {
    if (!notificacionMision) return;
    const timer = setTimeout(() => setNotificacionMision(null), 3200);
    return () => clearTimeout(timer);
  }, [notificacionMision]);

  const instalarApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setDeferredPrompt(null); }
    } else {
      alert("Para instalar: Toca 'Compartir' o los 3 puntos de tu navegador y elige 'Agregar a Inicio'.");
    }
  };

  const calcularEdad = (fechaNac: string) => {
    if(!fechaNac) return 15; 
    const hoy = new Date();
    const cumple = new Date(fechaNac);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
    return edad;
  };

  useEffect(() => {
    if (miHistorial.length > 0 && datosJoven) {
      const fechaActual = new Date();
      const activas = miHistorial.filter(v => {
        const dias = (fechaActual.getTime() - new Date(v.fecha).getTime()) / (1000 * 3600 * 24);
        return dias <= 90; 
      }).length;

      let nivelCalculado = "Clásica";
      let jerarquiaCalculada = 1;
      
      if (activas >= 40) { nivelCalculado = "VIP Black"; jerarquiaCalculada = 3; }
      else if (activas >= 15) { nivelCalculado = "Nivel Oro"; jerarquiaCalculada = 2; }

      const keyNivel = `nivel_guardado_${datosJoven.idFirebase}`;
      const nivelAnterior = localStorage.getItem(keyNivel);
      
      if (!nivelAnterior) {
        localStorage.setItem(keyNivel, nivelCalculado);
      } else {
        const jerarquiaAnterior = nivelAnterior === "VIP Black" ? 3 : (nivelAnterior === "Nivel Oro" ? 2 : 1);
        if (jerarquiaCalculada > jerarquiaAnterior) {
          setModalNivel({ mostrar: true, nivelNuevo: nivelCalculado, visitas: activas });
          localStorage.setItem(keyNivel, nivelCalculado); 
        } else if (jerarquiaCalculada < jerarquiaAnterior) {
          localStorage.setItem(keyNivel, nivelCalculado);
        }
      }
    }
  }, [miHistorial, datosJoven]);

  useEffect(() => {
    if (!datosJoven || new Set(misionesCompletadas).size < 5) return;
    const key = `recompensa_ruta_joven_${datosJoven.idFirebase}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, new Date().toISOString());
      setModalRutaCompletada(true);
    }
  }, [misionesCompletadas, datosJoven]);

  const obtenerProgreso = (idPromo: string, meta: number) => {
    const usos = miHistorial.filter(v => v.idPromo === idPromo).length;
    let actual = usos % meta;
    if (usos > 0 && actual === 0) actual = meta;
    const porcentaje = (actual / meta) * 100;
    return { actual, porcentaje, usosTotales: usos };
  };

  const descargarQR = () => {
    const canvas = document.getElementById("qr-joven") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl; downloadLink.download = `QR_${datosJoven.nombreCompleto.split(" ")[0]}.png`;
      document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink);
    }
  };

  const toggleTema = () => {
    const nuevoEstado = !modoOscuro;
    setModoOscuro(nuevoEstado);
    localStorage.setItem("temaTarjeta", nuevoEstado ? "dark" : "light");
  };

  const actualizarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaContrasena.length < 6) { alert("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    setCambiandoPass(true);
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error("Sesión no disponible");
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, contrasenaActual));
      await updatePassword(user, nuevaContrasena);
      alert("✅ ¡Contraseña actualizada con éxito!");
      setModalAjustes(false); 
      setNuevaContrasena("");
      setContrasenaActual("");
    } catch (error) { alert("Hubo un error al actualizar. Intenta de nuevo."); }
    setCambiandoPass(false);
  };

  const cerrarSesion = async () => {
    await signOut(auth);
    router.replace("/");
  };

  const abrirWhatsAppEmpleo = (empleo: any) => {
    if (!empleosContactados.includes(empleo.idFirebase)) {
      const nuevosGuardados = [...empleosContactados, empleo.idFirebase];
      setEmpleosContactados(nuevosGuardados);
      localStorage.setItem(`empleos_${datosJoven.idFirebase}`, JSON.stringify(nuevosGuardados));
    }
    window.open(`https://wa.me/52${empleo.telefonoContacto}`, '_blank');
  };

  if (!datosJoven) return null;

  const edadActual = calcularEdad(datosJoven.fechaNacimiento);
  if (edadActual >= 30) {
     return (
       <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
         <div className="relative z-10 bg-slate-800/80 backdrop-blur-md p-8 rounded-[3rem] shadow-2xl border border-white/10 max-w-sm">
            <div className="text-6xl mb-6">🎓</div>
            <h1 className="text-2xl font-black text-teal-400 mb-4 uppercase tracking-widest">¡Gracias por participar!</h1>
            <p className="text-sm font-medium text-slate-300 mb-6 leading-relaxed">
              El reglamento del Instituto Municipal de la Juventud establece que los beneficios de la Tarjeta Joven son aplicables hasta los 29 años. 
              <br/><br/>
              Has cumplido <span className="text-white font-black">{edadActual} años</span> y tu etapa como beneficiario ha concluido. ¡Te deseamos mucho éxito en tus futuros proyectos!
            </p>
            <button onClick={cerrarSesion} className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-colors">Cerrar Sesión</button>
         </div>
       </main>
     )
  }

  const fechaActualVisitas = new Date();
  const visitasActivas = miHistorial.filter(v => {
    const fechaVisita = new Date(v.fecha);
    const diasTranscurridos = (fechaActualVisitas.getTime() - fechaVisita.getTime()) / (1000 * 3600 * 24);
    return diasTranscurridos <= 90; 
  }).length;

  const esBlack = visitasActivas >= 40;
  const esOro = visitasActivas >= 15 && visitasActivas < 40;
  
  const nivelUserNum = esBlack ? 3 : (esOro ? 2 : 1);
  const jerarquiaPromos = { "Clásica": 1, "Oro": 2, "Black": 3 };

  let mensajeFomo = "";
  let colorFomo = "";
  let progresoFomo = 0;
  if (visitasActivas < 15) {
      mensajeFomo = `¡A solo ${15 - visitasActivas} visitas de Nivel Oro ⭐!`;
      colorFomo = "text-yellow-400";
      progresoFomo = (visitasActivas / 15) * 100;
  } else if (visitasActivas < 40) {
      mensajeFomo = `¡A solo ${40 - visitasActivas} visitas de VIP Black 👑!`;
      colorFomo = "text-fuchsia-400";
      progresoFomo = ((visitasActivas - 15) / 25) * 100;
  } else {
      mensajeFomo = "¡Eres el Nivel Máximo VIP Black! 👑";
      colorFomo = "text-fuchsia-400";
      progresoFomo = 100;
  }

  const hoy = new Date().toISOString().split("T")[0];
  const promosVigentes = listaPromos.filter(p => !p.fechaVencimiento || p.fechaVencimiento >= hoy);

  const irASeccion = (seccion: string) => {
    setPestañaActiva(seccion);
    setTimeout(() => document.getElementById("contenido-joven")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const misiones = [
    { id: "mostrar-qr", icon: "🪪", title: "Activa tu tarjeta", description: "Abre tu QR listo para escanear", reward: "+20 XP", action: () => setQrAmpliado(true) },
    { id: "explorar-beneficios", icon: "🎁", title: "Caza un beneficio", description: "Explora descuentos disponibles", reward: "+20 XP", action: () => irASeccion("promos") },
    { id: "conocer-aliado", icon: "🧭", title: "Conoce un aliado", description: "Encuentra un negocio en el mapa", reward: "+20 XP", action: () => irASeccion("directorio") },
    { id: "buscar-oportunidad", icon: "🚀", title: "Impulsa tu futuro", description: "Revisa vacantes juveniles", reward: "+20 XP", action: () => irASeccion("empleos") },
    { id: "primera-visita", icon: "⚡", title: "Primera visita", description: "Escanea tu tarjeta con un aliado", reward: "+40 XP", action: () => setQrAmpliado(true) },
  ];
  const totalMisiones = misiones.filter((mission) => misionesCompletadas.includes(mission.id)).length;
  const xpJoven = misiones.reduce((xp, mission) => xp + (misionesCompletadas.includes(mission.id) ? Number(mission.reward.replace(/\D/g, "")) : 0), 0);
  const rutaCompleta = totalMisiones === misiones.length;
  const visitasSemana = miHistorial.filter((visita) => {
    const dias = (Date.now() - new Date(visita.fecha).getTime()) / 86_400_000;
    return dias >= 0 && dias <= 7;
  }).length;
  const progresoSemanal = Math.min(100, (visitasSemana / 3) * 100);

  let filtrados: any[] = [];
  if (pestañaActiva === "promos") {
    filtrados = promosVigentes
      .filter(p => {
        const coincideBusqueda = p.nombreNegocio.toLowerCase().includes(busqueda.toLowerCase()) || p.titulo.toLowerCase().includes(busqueda.toLowerCase());
        const coincideFiltro = filtroTipoPromo === "todos" || p.tipo === filtroTipoPromo;
        return coincideBusqueda && coincideFiltro;
      })
      .sort((a, b) => {
        const numA = jerarquiaPromos[a.nivelRequerido as keyof typeof jerarquiaPromos] || 1;
        const numB = jerarquiaPromos[b.nivelRequerido as keyof typeof jerarquiaPromos] || 1;
        const blockA = numA > nivelUserNum;
        const blockB = numB > nivelUserNum;
        if (blockA !== blockB) return blockA ? 1 : -1;
        if (!blockA && !blockB) return numB - numA;
        return numA - numB;
      });
  } else if (pestañaActiva === "empleos") {
    filtrados = listaEmpleos.filter(e => e.titulo.toLowerCase().includes(busqueda.toLowerCase()));
  } else if (pestañaActiva === "directorio") {
    filtrados = listaNegocios.filter(n => 
      n.nombreComercial?.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.giro?.toLowerCase().includes(busqueda.toLowerCase())
    );
  }
  
  const themeColors = esBlack 
    ? { bg: "bg-[#050505]", border: "border-white/10", glow1: "bg-violet-600 animate-pulse", glow2: "bg-fuchsia-600 animate-pulse", text: "from-violet-400 to-fuchsia-400", badge: "VIP BLACK" }
    : esOro 
    ? { bg: "bg-gradient-to-br from-yellow-900 to-[#1a1300]", border: "border-yellow-500/30", glow1: "bg-yellow-500 animate-pulse", glow2: "bg-teal-500 animate-pulse", text: "from-yellow-300 to-yellow-600", badge: "NIVEL ORO" }
    : { bg: "bg-gradient-to-br from-slate-900 to-[#0a1128]", border: "border-blue-500/30", glow1: "bg-blue-500 animate-pulse", glow2: "bg-cyan-500 animate-pulse", text: "from-blue-300 to-cyan-300", badge: "CLÁSICA" };

  return (
    <main className={`app-shell motion-enter min-h-screen pb-24 font-sans selection:bg-violet-500/30 transition-colors duration-500 overflow-x-hidden ${modoOscuro ? "bg-[#080A12] text-white" : "bg-[#F6F7F9] text-slate-900"}`}>
      {modalRutaCompletada && (
        <div className="fixed inset-0 z-[400] grid place-items-center overflow-hidden bg-slate-950/85 p-5 backdrop-blur-md" onClick={() => setModalRutaCompletada(false)}>
          {["#64748B", "#f4c425", "#24b5d6", "#f70476", "#34d399", "#a78bfa"].map((color, index) => (
            <span key={color} className="celebration-spark top-0" style={{ left: `${14 + index * 14}%`, background: color, animationDelay: `${index * .18}s`, ["--spark-x" as string]: `${index % 2 ? 35 : -30}px` }}></span>
          ))}
          <section className="motion-enter relative w-full max-w-sm overflow-hidden rounded-[2.7rem] border border-white/10 bg-gradient-to-br from-[#171d31] to-[#080d18] p-7 text-center text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="brand-orb absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl"></div>
            <div className="relative mx-auto grid h-28 w-28 place-items-center rounded-[2.3rem] bg-gradient-to-br from-teal-400 via-pink-500 to-violet-600 text-6xl shadow-xl shadow-pink-950/40">🏅</div>
            <p className="relative mt-6 text-[9px] font-black uppercase tracking-[.3em] text-teal-300">Ruta inicial completada</p>
            <h2 className="relative mt-2 text-3xl font-black tracking-tight">¡Explorador de Elota!</h2>
            <p className="relative mt-3 text-sm font-medium leading-6 text-slate-300">Desbloqueaste tu primera insignia y <strong className="text-white">120 XP</strong>. Ahora comienzan retos que se cumplen con visitas reales.</p>
            <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Nuevo reto semanal</p><p className="mt-1 text-sm font-black">Registra 3 visitas</p></div><span className="text-3xl">⚡</span></div>
            </div>
            <button onClick={() => setModalRutaCompletada(false)} className="shine-sweep relative mt-6 w-full overflow-hidden rounded-2xl bg-white py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 active:scale-[.98]">Continuar mi aventura</button>
          </section>
        </div>
      )}

      {notificacionMision && (
        <div className="fixed left-1/2 top-5 z-[450] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-300/30 bg-slate-950/95 px-4 py-3 text-white shadow-2xl backdrop-blur-xl motion-enter">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/15 text-xl">✨</span>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">{notificacionMision.titulo}</p><p className="text-xs font-bold text-slate-300">Ganaste {notificacionMision.recompensa}</p></div>
          <button onClick={() => setNotificacionMision(null)} className="text-slate-500" aria-label="Cerrar notificación">✕</button>
        </div>
      )}

      {modalMisiones && (
        <div className="fixed inset-0 z-[350] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" onClick={() => setModalMisiones(false)}>
          <section className={`motion-enter max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-[2.3rem] border p-5 shadow-2xl sm:rounded-[2.3rem] sm:p-7 ${modoOscuro ? "border-white/10 bg-[#111625] text-white" : "border-slate-100 bg-white text-slate-900"}`} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.24em] text-teal-500">Ruta joven</p><h2 className="mt-1 text-2xl font-black">Misiones y recompensas</h2><p className="mt-1 text-xs font-medium text-slate-400">Avanza a tu ritmo. Puedes cerrar esta sección cuando quieras.</p></div><button onClick={() => setModalMisiones(false)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${modoOscuro ? "bg-white/10" : "bg-slate-100"}`} aria-label="Cerrar misiones">✕</button></div>
            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-teal-500 to-pink-500 p-4 text-white"><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-widest text-teal-100">Progreso total</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${(totalMisiones / misiones.length) * 100}%` }}></div></div></div><div className="text-right"><strong className="block text-xl">{xpJoven} XP</strong><span className="text-[9px] font-bold">{totalMisiones}/5 listas</span></div></div>
            {rutaCompleta && <div className={`mt-4 rounded-2xl border p-4 ${modoOscuro ? "border-violet-400/20 bg-violet-400/10" : "border-violet-100 bg-violet-50"}`}><div className="flex items-center justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-500">🏅 Explorador de Elota</p><p className="mt-1 text-xs font-medium text-slate-400">Reto semanal: registra tres visitas.</p></div><strong className="text-lg text-violet-500">{Math.min(visitasSemana, 3)}/3</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-200/40 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${progresoSemanal}%` }}></div></div></div>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {misiones.map((mission) => {
                const complete = misionesCompletadas.includes(mission.id);
                return <button key={mission.id} onClick={() => { setModalMisiones(false); setTimeout(() => mission.id === "primera-visita" && miHistorial.length === 0 ? mission.action() : ejecutarMision(mission.id, mission.action, mission.reward), 160); }} className={`rounded-2xl border p-4 text-left transition active:scale-[.98] ${complete ? "border-emerald-200 bg-emerald-50 dark:border-emerald-700/40 dark:bg-emerald-900/20" : modoOscuro ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"}`}><div className="flex items-center justify-between"><span className="text-2xl">{complete ? "✅" : mission.icon}</span><span className={`rounded-full px-2 py-1 text-[8px] font-black ${complete ? "bg-emerald-500 text-white" : "bg-teal-100 text-teal-700"}`}>{complete ? "LISTA" : mission.reward}</span></div><h3 className="mt-3 text-sm font-black">{mission.title}</h3><p className="mt-1 text-[10px] font-medium text-slate-400">{mission.description}</p></button>;
              })}
            </div>
          </section>
        </div>
      )}
      
      {/* HEADER CON CAMPANITA */}
      <div className={`brand-header-card mx-4 mt-4 mb-6 max-w-md p-4 sm:mx-auto animate-fade-in ${modoOscuro ? "brand-header-dark" : ""}`}>
      <div className="flex justify-between items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="brand-logo-stage">
             <img src="/imju-elota.webp" alt="IMJU Elota" />
          </div>
          <div className="min-w-0">
            <p className="mb-1 bg-gradient-to-r from-teal-500 via-pink-500 to-cyan-500 bg-clip-text text-[9px] font-black uppercase tracking-[.22em] text-transparent">Experiencia joven · Elota</p>
            <h1 className={`max-w-[145px] truncate text-xl font-black tracking-tighter ${modoOscuro ? "text-white" : "text-slate-900"}`}>¡Qué onda, {datosJoven.nombreCompleto.split(" ")[0]}!</h1>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setModalAvisos(true)} className={`relative w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all ${modoOscuro ? "bg-[#161B2C] text-slate-300 hover:text-white" : "bg-white shadow-md border border-slate-100 text-slate-400 hover:text-[#0F766E]"}`}>
             🔔
             {avisosNoLeidos > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>}
          </button>
          
          <button onClick={() => setModalAjustes(true)} className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all ${modoOscuro ? "bg-[#161B2C] text-slate-300 hover:text-white" : "bg-white shadow-md border border-slate-100 text-slate-400 hover:text-slate-800"}`}>⚙️</button>
        </div>
      </div>
      </div>

      <div className="mx-auto w-full max-w-md">
      {/* TARJETA DIGITAL */}
      <div className="max-w-md w-full mx-auto px-6 lg:px-0 relative z-20 perspective-1000 animate-slide-up">
        <div className={`relative transition-all duration-700 hover:shadow-2xl ${themeColors.bg} rounded-[2.5rem] p-7 overflow-hidden border ${themeColors.border} shadow-2xl`}>
          
          <div className="absolute inset-0 z-10 pointer-events-none opacity-40 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]"></div>
          <img src="/imju-elota.webp" alt="" aria-hidden="true" className="brand-card-watermark" />
          <div className="brand-swarm" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
          <div className={`absolute -top-24 -right-24 w-60 h-60 rounded-full mix-blend-screen filter blur-[70px] opacity-60 transition-colors duration-700 z-0 ${themeColors.glow1}`}></div>
          <div className={`absolute -bottom-24 -left-24 w-60 h-60 rounded-full mix-blend-screen filter blur-[70px] opacity-60 transition-colors duration-700 z-0 ${themeColors.glow2}`}></div>

          <div className="relative z-20 flex justify-between items-start mb-6">
            <div>
              <span className={`text-transparent bg-clip-text bg-gradient-to-r text-[11px] font-black tracking-[0.4em] uppercase ${themeColors.text}`}>Tarjeta Joven</span>
              <p className="text-white/50 text-[9px] font-mono mt-1.5 tracking-widest italic">{datosJoven.codigoUnicoQR}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
               <span className="bg-white/10 backdrop-blur-lg border border-white/20 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                 {esBlack ? "👑" : esOro ? "⭐" : "🔹"} {themeColors.badge}
               </span>
            </div>
          </div>
          
          <div className="relative z-20 flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`absolute inset-0 rounded-[1.2rem] bg-gradient-to-tr blur-sm opacity-50 ${themeColors.text}`}></div>
                <img src={datosJoven.fotoPerfil} className={`relative w-20 h-20 rounded-[1.2rem] object-cover border-2 border-white/20 shadow-lg ${themeColors.bg}`} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md truncate max-w-[140px] md:max-w-[160px]">{datosJoven.nombreCompleto.split(" ")[0]} {datosJoven.nombreCompleto.split(" ")[1] || ""}</h2>
                
                <div className="mt-1 flex flex-col">
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">
                    Visitas: <span className={`font-black text-sm ml-0.5 ${esBlack ? 'text-fuchsia-400' : esOro ? 'text-yellow-400' : 'text-cyan-400'}`}>{visitasActivas}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="cursor-pointer bg-white p-2 rounded-2xl shadow-lg active:scale-95 transition-transform flex-shrink-0" onClick={() => ejecutarMision("mostrar-qr", () => setQrAmpliado(true))}>
              <QRCodeCanvas value={datosJoven.codigoUnicoQR} size={64} level="M" marginSize={2} />
            </div>
          </div>

          <div className="relative z-20 mt-2 bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10">
             <div className="flex justify-between items-center mb-2">
                <span className={`text-[9px] font-black uppercase tracking-widest animate-pulse ${colorFomo}`}>
                  {mensajeFomo}
                </span>
             </div>
             {visitasActivas < 40 && (
               <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full transition-all duration-1000 ${esOro ? 'bg-gradient-to-r from-yellow-400 to-fuchsia-500' : 'bg-gradient-to-r from-blue-400 to-yellow-400'}`} style={{ width: `${progresoFomo}%` }}></div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Acceso compacto: los detalles viven en una hoja opcional. */}
      <section className="mx-auto mt-4 w-full max-w-md px-6">
        <button onClick={() => setModalMisiones(true)} className={`brand-mini-card interactive-card flex w-full items-center gap-4 rounded-2xl p-3.5 text-left ${modoOscuro ? "brand-mini-dark" : ""}`}>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-pink-500 text-xl text-white">{rutaCompleta ? "🏅" : "✨"}</div>
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className={`truncate text-xs font-black ${modoOscuro ? "text-white" : "text-slate-900"}`}>{rutaCompleta ? "Explorador de Elota" : "Tu ruta joven"}</p><span className="text-[9px] font-black text-teal-500">{totalMisiones}/5</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-pink-500" style={{ width: `${(totalMisiones / misiones.length) * 100}%` }}></div></div></div>
          <span className="shrink-0 text-slate-400">›</span>
        </button>
      </section>

      <section className="mx-auto mt-3 grid w-full max-w-md grid-cols-2 gap-3 px-6" aria-label="Redes sociales de IMJU Elota">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="interactive-card flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-pink-900/15" aria-label="Abrir Instagram de IMJU Elota">
          <span aria-hidden="true" className="text-base">◎</span> Instagram
        </a>
        <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="interactive-card flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-blue-900/15" aria-label="Abrir Facebook de IMJU Elota">
          <span aria-hidden="true" className="text-base font-black">f</span> Facebook
        </a>
      </section>
      </div>

      {/* ESTILOS Y SCROLLBAR INTELIGENTE */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer { 0% { transform: translateX(-150%); } 100% { transform: translateX(150%); } }
        @keyframes slide-up { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* SCROLL ESTÉTICO PARA MOUSE (PC) Y OCULTO EN TOUCH (CELULAR) */
        @media (pointer: fine) { 
          .scroll-estetico::-webkit-scrollbar { width: 6px; height: 6px; }
          .scroll-estetico::-webkit-scrollbar-track { background: transparent; }
          .scroll-estetico::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.3); border-radius: 10px; }
          .scroll-estetico:hover::-webkit-scrollbar-thumb { background-color: rgba(139, 92, 246, 0.6); } 
        }
        @media (pointer: coarse) { 
          .scroll-estetico::-webkit-scrollbar { display: none; }
          .scroll-estetico { -ms-overflow-style: none; scrollbar-width: none; }
        }
      `}} />

      {/* BUSCADOR Y FILTROS */}
      <div id="contenido-joven" className="max-w-md mx-auto px-6 mt-8 scroll-mt-6">
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Buscar descuentos, comercios..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`w-full rounded-[2rem] px-7 py-4 text-sm font-bold outline-none transition-all focus:ring-4 shadow-sm ${modoOscuro ? "bg-[#111625] border border-white/10 text-white placeholder-slate-500 focus:ring-violet-500/20" : "bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-[#0F766E]/20"}`}
          />
          <span className="absolute right-5 top-4 text-slate-400 text-lg">🔍</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 scroll-estetico mb-2 snap-x">
          {[
            { id: "promos", icon: "🎁", label: "Beneficios" },
            { id: "directorio", icon: "🏪", label: "Directorio" },
            { id: "empleos", icon: "💼", label: "Empleos" },
            { id: "actividad", icon: "⚡", label: "Actividad" }
          ].map((tab) => {
            const activo = pestañaActiva === tab.id;
            return (
              <button key={tab.id} onClick={() => setPestañaActiva(tab.id)} className={`snap-center whitespace-nowrap px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activo ? (modoOscuro ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50" : "bg-slate-900 text-white shadow-lg") : (modoOscuro ? "bg-[#111625] text-slate-400 border border-white/5" : "bg-white text-slate-500 border border-slate-200 shadow-sm")}`}>
                 {tab.icon} {tab.label}
              </button>
            )
          })}
        </div>

        {pestañaActiva === "promos" && (
            <div className="flex gap-2 pb-4 overflow-x-auto scroll-estetico mb-4 snap-x">
                <button onClick={() => setFiltroTipoPromo("todos")} className={`snap-center shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border ${filtroTipoPromo === "todos" ? (modoOscuro ? "bg-white text-slate-900 border-white" : "bg-slate-900 text-white border-slate-900") : (modoOscuro ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500 bg-white")}`}>🔥 Todos</button>
                <button onClick={() => setFiltroTipoPromo("Directa")} className={`snap-center shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border ${filtroTipoPromo === "Directa" ? "bg-emerald-500 text-white border-emerald-500 shadow-md" : (modoOscuro ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500 bg-white")}`}>🏷️ Descuentos</button>
                <button onClick={() => setFiltroTipoPromo("Cumpleaños")} className={`snap-center shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border ${filtroTipoPromo === "Cumpleaños" ? "bg-teal-500 text-white border-teal-500 shadow-md" : (modoOscuro ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500 bg-white")}`}>🎂 Cumpleaños</button>
                <button onClick={() => setFiltroTipoPromo("Frecuente")} className={`snap-center shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border ${filtroTipoPromo === "Frecuente" ? "bg-fuchsia-600 text-white border-fuchsia-600 shadow-md" : (modoOscuro ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500 bg-white")}`}>⭐ Lealtad</button>
            </div>
        )}

        <div className="space-y-6">
          {cargandoDatos ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <div className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${modoOscuro ? "border-violet-500/20 border-t-violet-500" : "border-slate-200 border-t-slate-800"}`}></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando...</p>
            </div>
          ) : (
            filtrados.length === 0 && pestañaActiva !== "actividad" ? (
              <div className={`text-center py-16 rounded-[2.5rem] border-2 border-dashed ${modoOscuro ? "bg-[#111625] border-white/10" : "bg-white border-slate-200"}`}>
                 <p className="text-4xl mb-3 opacity-50">🧐</p>
                 <p className={`font-bold text-sm ${modoOscuro ? "text-slate-500" : "text-slate-400"}`}>Pronto habrá más oportunidades.</p>
              </div>
            ) : (
              <>
                {pestañaActiva === "promos" && filtrados.map((p) => {
                  
                  const nivelPromo = p.nivelRequerido || "Clásica";
                  const promoNum = jerarquiaPromos[nivelPromo as keyof typeof jerarquiaPromos] || 1;
                  const bloqueada = promoNum > nivelUserNum;

                  if (bloqueada) {
                    return (
                      <div key={p.idFirebase} className={`relative rounded-[2.5rem] p-6 transition-all duration-300 overflow-hidden border ${modoOscuro ? "bg-[#111625] border-white/5" : "bg-white shadow-sm border-slate-200"}`}>
                        <div className="filter blur-md opacity-40 pointer-events-none select-none">
                          <div className="flex gap-4 items-center mb-5">
                            <div className={`w-16 h-16 rounded-2xl ${modoOscuro ? "bg-slate-800" : "bg-slate-200"}`}></div>
                            <div className="flex-1 space-y-2">
                              <div className={`h-2 w-1/3 rounded ${modoOscuro ? "bg-slate-700" : "bg-slate-300"}`}></div>
                              <div className={`h-4 w-3/4 rounded ${modoOscuro ? "bg-slate-700" : "bg-slate-300"}`}></div>
                            </div>
                          </div>
                          <div className={`h-3 w-full rounded mb-2 ${modoOscuro ? "bg-slate-800" : "bg-slate-200"}`}></div>
                          <div className={`h-3 w-4/5 rounded ${modoOscuro ? "bg-slate-800" : "bg-slate-200"}`}></div>
                        </div>

                        <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-6 ${modoOscuro ? "bg-black/50" : "bg-white/60"} backdrop-blur-sm`}>
                          <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-2xl mb-3 shadow-xl ${nivelPromo === "Black" ? "bg-[#050505] text-fuchsia-400 border border-white/10" : "bg-gradient-to-br from-yellow-500 to-yellow-700 text-white border border-yellow-300/30"}`}>🔒</div>
                          <h4 className={`text-xl font-black leading-tight drop-shadow-md ${modoOscuro ? "text-white" : "text-slate-900"}`}>Exclusivo Nivel {nivelPromo}</h4>
                          <p className={`text-[9px] font-black uppercase tracking-widest mt-2 px-4 py-1.5 rounded-full ${modoOscuro ? "bg-white/10 text-slate-300" : "bg-slate-900/10 text-slate-700"}`}>¡Sigue visitando para desbloquear!</p>
                        </div>
                      </div>
                    );
                  }

                  const { actual, porcentaje } = obtenerProgreso(p.idFirebase, p.visitasMeta);
                  const esFrecuente = p.tipo === "Frecuente";
                  const esCumple = p.tipo === "Cumpleaños";
                  const esUnicoUso = p.usoUnico === true;
                  const yaCanjeado = esUnicoUso && miHistorial.some(v => v.idPromo === p.idFirebase);

                  return (
                    <div key={p.idFirebase} className={`rounded-[2.5rem] p-6 transition-all duration-300 border ${modoOscuro ? "bg-[#111625] border-white/5" : "bg-white shadow-lg border-slate-100 hover:shadow-xl"} ${yaCanjeado ? "opacity-60 grayscale" : ""}`}>
                      <div className="flex gap-4 items-center mb-4">
                        <div className={`w-16 h-16 rounded-[1.2rem] object-cover flex-shrink-0 flex items-center justify-center border shadow-sm p-1 ${modoOscuro ? "bg-[#080A12] border-white/10" : "bg-white border-slate-100"}`}>
                           <img src={p.logoNegocio || "/imju-elota.webp"} className="w-full h-full object-contain rounded-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[9px] font-black uppercase tracking-widest truncate ${esFrecuente ? 'text-fuchsia-500' : esCumple ? 'text-teal-500' : 'text-emerald-500'}`}>{p.nombreNegocio}</p>
                          <h4 className={`text-xl font-black leading-tight truncate mt-0.5 ${modoOscuro ? "text-white" : "text-slate-900"}`}>{p.titulo}</h4>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                         {esUnicoUso && <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">Válido 1 Vez</span>}
                         {esCumple && <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">Cumpleañero 🎂</span>}
                         {p.diasValidos && p.diasValidos !== "Todos los días" && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">{p.diasValidos}</span>}
                      </div>

                      {p.imagen && (
                         <img src={p.imagen} alt="Cupón" className={`w-full h-44 object-cover rounded-[1.5rem] mb-4 border shadow-inner ${modoOscuro ? "border-white/10" : "border-slate-100"}`} />
                      )}

                      <p className={`text-sm font-medium leading-relaxed mb-5 ${modoOscuro ? "text-slate-400" : "text-slate-500"}`}>{p.descripcion}</p>
                      
                      {esFrecuente && (
                        <div className={`mb-6 p-5 rounded-[1.5rem] border ${modoOscuro ? "bg-[#080A12] border-white/5" : "bg-slate-50 border-slate-200"}`}>
                          <div className="flex justify-between items-end mb-2.5">
                             <p className={`text-[9px] font-black uppercase tracking-widest ${actual === p.visitasMeta ? "text-fuchsia-500 animate-pulse" : (modoOscuro ? "text-slate-500" : "text-slate-500")}`}>
                               {actual === p.visitasMeta ? "¡Premio listo! 🎁" : "Progreso de Lealtad"}
                             </p>
                             <p className={`text-sm font-black ${modoOscuro ? "text-white" : "text-slate-800"}`}>{actual} <span className={modoOscuro ? "text-slate-500" : "text-slate-400"}>/ {p.visitasMeta}</span></p>
                          </div>
                          <div className={`w-full h-3 rounded-full overflow-hidden shadow-inner ${modoOscuro ? "bg-[#161B2C]" : "bg-slate-200"}`}>
                             <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000" style={{ width: `${porcentaje}%` }}></div>
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex items-center justify-between pt-5 border-t ${modoOscuro ? "border-white/10" : "border-slate-100"}`}>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.direccion + ', Elota, Sinaloa')}`} target="_blank" rel="noopener noreferrer" className={`text-[10px] font-bold flex items-center gap-1.5 hover:underline cursor-pointer ${modoOscuro ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
                           <span className="text-red-500 text-base drop-shadow-sm">📍</span> <span className="truncate max-w-[120px]">{p.direccion}</span>
                        </a>

                        {yaCanjeado ? (
                          <span className="text-[10px] font-black px-6 py-3 rounded-full uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-500 shadow-inner">Canjeado ✔️</span>
                        ) : (
                          <button onClick={() => setQrAmpliado(true)} className={`text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-all ${modoOscuro ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/50" : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 active:scale-95"}`}>Usar Cupón</button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* DIRECTORIO HOMOLOGADO */}
                {pestañaActiva === "directorio" && (
                  <div className="animate-fade-in space-y-4">
                    <div className={`flex p-1.5 rounded-2xl mb-4 shadow-inner ${modoOscuro ? "bg-slate-800" : "bg-slate-100"}`}>
                      <button onClick={() => setVistaDirectorio("lista")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaDirectorio === "lista" ? (modoOscuro ? "bg-slate-700 text-white shadow-md" : "bg-white text-slate-900 shadow-md") : "text-slate-500"}`}>📋 Lista</button>
                      <button onClick={() => setVistaDirectorio("mapa")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaDirectorio === "mapa" ? (modoOscuro ? "bg-slate-700 text-white shadow-md" : "bg-white text-slate-900 shadow-md") : "text-slate-500"}`}>🗺️ Mapa</button>
                    </div>

                    {vistaDirectorio === "lista" ? (
                      <div className="grid grid-cols-1 gap-4">
                        {filtrados.map((n) => (
                          <div key={n.idFirebase} onClick={() => setNegocioSeleccionado(n)} className={`rounded-[2rem] p-5 flex flex-col relative overflow-hidden group cursor-pointer transition-all border ${modoOscuro ? "bg-[#111625] border-white/5 hover:border-violet-500/30" : "bg-white border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1"}`}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                            
                            <div className="flex items-center gap-4 mb-4">
                              <div className={`w-16 h-16 rounded-[1.2rem] flex-shrink-0 flex items-center justify-center p-2 shadow-sm ${modoOscuro ? "bg-slate-800 border border-slate-700" : "bg-slate-50 border border-slate-100"}`}>
                                <img src={n.logo || "/imju-elota.webp"} alt={n.nombreComercial} className="w-full h-full object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 inline-block truncate max-w-full ${modoOscuro ? "text-violet-400 bg-violet-900/30 border border-violet-800" : "text-violet-600 bg-violet-50 border border-violet-100"}`}>{n.giro}</span>
                                <h3 className={`font-black text-lg leading-tight truncate group-hover:text-violet-500 transition-colors ${modoOscuro ? "text-white" : "text-slate-800"}`}>{n.nombreComercial}</h3>
                              </div>
                            </div>

                            <div className={`mt-auto pt-4 border-t flex justify-between items-center ${modoOscuro ? "border-white/10" : "border-slate-100"}`}>
                               <div className="flex -space-x-2">
                                 <span className="w-6 h-6 rounded-full bg-teal-100 text-xs flex items-center justify-center z-10 border border-white">🏷️</span>
                                 <span className="w-6 h-6 rounded-full bg-emerald-100 text-xs flex items-center justify-center z-0 border border-white">🎉</span>
                               </div>
                               <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${modoOscuro ? "text-slate-400 group-hover:text-violet-400" : "text-slate-400 group-hover:text-violet-600"}`}>Ver Perfil →</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`h-[50vh] min-h-[400px] rounded-[2.5rem] overflow-hidden relative z-0 border-4 ${modoOscuro ? "border-slate-800" : "border-white shadow-xl"}`}>
                        <MapContainer center={centroElota} zoom={15} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          {filtrados.map((n) => (
                            <Marker key={n.idFirebase} position={[n.lat || 23.92173, n.lng || -106.89264]}>
                              <Popup className="rounded-2xl overflow-hidden shadow-2xl border-0">
                                <div className="text-center p-2 min-w-[160px]">
                                  <img src={n.logo || "/imju-elota.webp"} className="w-14 h-14 mx-auto rounded-xl mb-3 border-2 border-slate-100 object-contain shadow-sm bg-white" />
                                  <h4 className="font-black text-slate-800 text-base mb-1 leading-tight">{n.nombreComercial}</h4>
                                  <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-1 rounded-md uppercase tracking-widest block mb-3">{n.giro}</span>
                                  <button onClick={() => setNegocioSeleccionado(n)} className="bg-slate-900 text-white text-[10px] font-black px-4 py-2.5 rounded-xl uppercase tracking-widest w-full transition-colors shadow-md">Abrir Perfil</button>
                                </div>
                              </Popup>
                            </Marker>
                          ))}
                        </MapContainer>
                      </div>
                    )}
                  </div>
                )}

                {/* EMPLEOS CON DESCRIPCIÓN */}
                {pestañaActiva === "empleos" && filtrados.map((e) => {
                   const yaContactado = empleosContactados.includes(e.idFirebase);
                   return (
                     <div key={e.idFirebase} className={`rounded-[2.5rem] p-7 transition-all border ${modoOscuro ? "bg-[#111625] border-white/5" : "bg-white shadow-lg border-slate-100 hover:shadow-xl"}`}>
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest bg-fuchsia-50 px-2 py-1 rounded-md border border-fuchsia-100">{e.nombreNegocio}</p>
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase ${modoOscuro ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>{e.tipo}</span>
                        </div>
                        <h4 className={`text-2xl font-black tracking-tight leading-tight mb-4 ${modoOscuro ? "text-white" : "text-slate-900"}`}>{e.titulo}</h4>
                        
                        {/* NUEVO: SECCIÓN DE DESCRIPCIÓN CON SCROLL ESTÉTICO */}
                        {e.descripcion && (
                          <div className={`mb-5 p-4 rounded-[1.2rem] text-[13px] font-medium leading-relaxed max-h-32 overflow-y-auto scroll-estetico border shadow-inner ${modoOscuro ? "bg-[#0A0D18] text-slate-300 border-white/5" : "bg-slate-50 text-slate-600 border-slate-100"}`}>
                             <p className="whitespace-pre-wrap">{e.descripcion}</p>
                          </div>
                        )}
                        
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.direccion + ', Elota, Sinaloa')}`} target="_blank" rel="noopener noreferrer" className={`text-[10px] font-bold flex items-center gap-1.5 hover:underline cursor-pointer mb-5 ${modoOscuro ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
                           <span className="text-red-500 text-base drop-shadow-sm">📍</span> {e.direccion}
                        </a>

                        <p className={`font-black text-xl mt-1.5 mb-5 ${modoOscuro ? "text-emerald-400" : "text-emerald-600"}`}>{e.sueldo}</p>
                        <button onClick={() => abrirWhatsAppEmpleo(e)} className={`w-full font-black py-4 rounded-xl text-[11px] uppercase tracking-widest transition-all shadow-sm active:scale-95 ${yaContactado ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : (modoOscuro ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50" : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20")}`}>
                          {yaContactado ? "✅ Ya contactado (WhatsApp)" : "💬 Enviar WhatsApp"}
                        </button>
                     </div>
                   );
                })}

                {pestañaActiva === "actividad" && (
                  <div className="space-y-4">
                    {miHistorial.length === 0 ? (
                      <div className={`text-center py-16 rounded-[2.5rem] border-2 border-dashed ${modoOscuro ? "bg-[#111625] border-white/10" : "bg-white border-slate-200"}`}>
                         <p className="text-4xl mb-3 opacity-50">⚡</p>
                         <p className={`font-bold text-sm ${modoOscuro ? "text-slate-500" : "text-slate-400"}`}>Aún no tienes actividad.</p>
                      </div>
                    ) : (
                      miHistorial.map((v) => (
                        <div key={v.idFirebase} className={`p-5 rounded-[2rem] flex items-center gap-5 border ${modoOscuro ? "bg-[#111625] border-white/5" : "bg-white shadow-sm border-slate-100"}`}>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border ${modoOscuro ? "bg-violet-900/30 text-violet-400 border-violet-800" : "bg-violet-50 text-violet-600 border-violet-100"}`}>⚡</div>
                          <div className="flex-1">
                            <p className={`font-black text-lg leading-tight ${modoOscuro ? "text-white" : "text-slate-800"}`}>{v.nombreNegocio}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${modoOscuro ? "text-slate-400" : "text-slate-500"}`}>{v.nombrePromo}</p>
                          </div>
                          <p className={`text-[10px] font-black uppercase text-center ${modoOscuro ? "text-slate-500" : "text-slate-400"}`}>
                             {new Date(v.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* MODAL PERFIL DEL NEGOCIO (App Style) */}
      {negocioSeleccionado && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-6 animate-fade-in" onClick={() => setNegocioSeleccionado(null)}>
          <div className={`w-full max-w-md h-[92vh] md:h-auto md:max-h-[85vh] overflow-y-auto scroll-estetico rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative flex flex-col animate-slide-up ${modoOscuro ? "bg-[#161B2C]" : "bg-[#F3F5F9]"}`} onClick={e => e.stopPropagation()}>
            
            <div className={`p-8 pt-10 rounded-b-[2.5rem] shadow-sm relative shrink-0 text-center border-b ${modoOscuro ? "bg-[#111625] border-white/10" : "bg-white border-slate-100"}`}>
               <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 md:hidden ${modoOscuro ? "bg-slate-700" : "bg-slate-200"}`}></div>
               <button onClick={() => setNegocioSeleccionado(null)} className={`absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${modoOscuro ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 text-slate-400 hover:text-slate-900"}`}>✕</button>
               
               <div className={`w-28 h-28 mx-auto rounded-[2rem] shadow-xl mb-5 overflow-hidden flex items-center justify-center p-2 border-4 ${modoOscuro ? "bg-slate-800 border-slate-700" : "bg-white border-slate-50"}`}>
                 <img src={negocioSeleccionado.logo || "/imju-elota.webp"} className="w-full h-full object-contain" />
               </div>
               
               <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block shadow-sm ${modoOscuro ? "text-violet-400 bg-violet-900/30 border border-violet-800" : "text-violet-600 bg-violet-50 border border-violet-100"}`}>
                 {negocioSeleccionado.giro}
               </span>
               
               <h2 className={`text-3xl font-black leading-tight tracking-tight mb-2 ${modoOscuro ? "text-white" : "text-slate-900"}`}>{negocioSeleccionado.nombreComercial}</h2>
               <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">⭐ Aliado Oficial IMJU</p>
            </div>

            <div className="p-6 flex-1 space-y-4">
               {/* HORARIOS Y CONTACTO */}
               <div className="grid grid-cols-2 gap-3 mb-2">
                 <div className={`p-4 rounded-[2rem] shadow-sm border text-center flex flex-col items-center justify-center gap-1 ${modoOscuro ? "bg-[#111625] border-white/5" : "bg-white border-slate-100"}`}>
                    <span className="text-2xl mb-1">🕒</span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Horario</p>
                    <p className={`text-xs font-bold ${modoOscuro ? "text-slate-300" : "text-slate-700"}`}>
                      {negocioSeleccionado.horario ? negocioSeleccionado.horario : "Consulta en local"}
                    </p>
                 </div>
                 
                 {negocioSeleccionado.telefono ? (
                   <a href={`https://wa.me/52${negocioSeleccionado.telefono}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-green-600 transition-colors p-4 rounded-[2rem] shadow-sm text-center flex flex-col items-center justify-center gap-1 group">
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">💬</span>
                      <p className="text-[9px] font-black uppercase tracking-widest text-green-100">Contactar</p>
                      <p className="text-xs font-bold text-white">WhatsApp</p>
                   </a>
                 ) : (
                   <div className={`p-4 rounded-[2rem] shadow-sm border text-center flex flex-col items-center justify-center gap-1 opacity-50 ${modoOscuro ? "bg-[#111625] border-white/5" : "bg-white border-slate-100"}`}>
                      <span className="text-2xl mb-1">📵</span>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sin Teléfono</p>
                   </div>
                 )}
               </div>

               {negocioSeleccionado.menuImagen && (
                 <div className={`rounded-[2rem] p-5 shadow-sm border ${modoOscuro ? "bg-[#111625] border-white/5" : "bg-white border-slate-100"}`}>
                   <h3 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${modoOscuro ? "text-white" : "text-slate-800"}`}>📖 Ver Menú</h3>
                   <div className="w-full h-32 rounded-xl overflow-hidden relative group cursor-pointer border border-slate-200">
                      <img src={negocioSeleccionado.menuImagen} alt="Menú" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                         <span className="bg-white/90 text-slate-900 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">Ver Completo</span>
                      </div>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AVISOS (Bandeja) */}
      {modalAvisos && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex justify-center items-end md:items-center animate-fade-in" onClick={cerrarModalAvisos}>
          <div className={`p-6 md:p-8 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative w-full max-w-md h-[80vh] md:h-auto flex flex-col animate-slide-up ${modoOscuro ? "bg-[#161B2C] border border-white/10" : "bg-[#F3F5F9]"}`} onClick={e => e.stopPropagation()}>
            <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 md:hidden ${modoOscuro ? "bg-slate-700" : "bg-slate-300"}`}></div>
            <button onClick={cerrarModalAvisos} className={`absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${modoOscuro ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-white shadow-sm text-slate-400 hover:text-slate-900"}`}>✕</button>
            
            <h3 className={`text-2xl font-black mb-1 flex items-center gap-2 tracking-tight ${modoOscuro ? "text-white" : "text-slate-900"}`}>
               🔔 Bandeja 
            </h3>
            <p className={`text-[11px] font-black uppercase tracking-widest mb-6 ${modoOscuro ? "text-slate-500" : "text-slate-400"}`}>Comunicados IMJU</p>
            
            <div className="flex-1 overflow-y-auto scroll-estetico space-y-4 pr-1 pb-10">
               {avisos.length === 0 ? (
                  <p className={`text-center py-10 text-sm font-bold ${modoOscuro ? "text-slate-500" : "text-slate-400"}`}>No tienes mensajes por ahora.</p>
               ) : (
                  avisos.map(a => {
                    const vistos = JSON.parse(localStorage.getItem("avisosVistosJoven") || "[]");
                    const esNuevo = !vistos.includes(a.idFirebase);
                    return (
                      <div key={a.idFirebase} className={`p-6 rounded-[2rem] border-l-4 transition-all ${modoOscuro ? "bg-[#111625] border-white/5" : "bg-white shadow-sm border-slate-100"} ${esNuevo ? "border-l-violet-500" : (modoOscuro ? "border-l-slate-800" : "border-l-slate-200")}`}>
                         <div className="flex justify-between items-start mb-2">
                           <h4 className={`font-black text-lg leading-tight pr-4 ${modoOscuro ? "text-white" : "text-slate-800"}`}>{a.titulo}</h4>
                           {esNuevo && <span className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></span>}
                         </div>
                         <p className={`text-sm font-medium leading-relaxed mb-4 ${modoOscuro ? "text-slate-400" : "text-slate-500"}`}>{a.mensaje}</p>
                         <p className={`text-[9px] font-black uppercase tracking-widest ${modoOscuro ? "text-slate-600" : "text-slate-400"}`}>{new Date(a.fecha).toLocaleDateString()}</p>
                      </div>
                    );
                  })
               )}
            </div>
            
            <div className="pt-4 mt-auto">
               <button onClick={cerrarModalAvisos} className={`w-full font-black py-4.5 rounded-xl text-[11px] uppercase tracking-widest transition-all ${modoOscuro ? "bg-[#111625] text-white border border-white/10 hover:bg-slate-800" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"}`}>Cerrar Bandeja</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJUSTES */}
      {modalAjustes && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-6 animate-fade-in" onClick={() => setModalAjustes(false)}>
          <div className={`p-8 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative w-full max-w-sm animate-slide-up ${modoOscuro ? "bg-[#161B2C] border border-white/10" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 md:hidden ${modoOscuro ? "bg-slate-700" : "bg-slate-300"}`}></div>
            <button onClick={() => setModalAjustes(false)} className={`absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${modoOscuro ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>✕</button>
            
            <div className="flex justify-between items-center mb-2">
               <h3 className={`text-2xl font-black tracking-tight ${modoOscuro ? "text-white" : "text-slate-900"}`}>Ajustes</h3>
               <button onClick={toggleTema} className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-2xl transition-all shadow-sm border ${modoOscuro ? "bg-[#111625] text-yellow-400 border-white/5" : "bg-slate-50 border-slate-100 text-slate-400"}`}>{modoOscuro ? "☀️" : "🌙"}</button>
            </div>
            <p className={`text-xs font-medium mb-8 ${modoOscuro ? "text-slate-400" : "text-slate-500"}`}>Configura tu cuenta y aplicación.</p>
            
            <button onClick={instalarApp} className={`w-full mb-6 flex items-center justify-center gap-2 font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest transition-all ${modoOscuro ? "bg-violet-900/30 text-violet-400 border border-violet-500/30" : "bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100"}`}>
               📱 Instalar App en Celular
            </button>

            <form onSubmit={actualizarContrasena} className="space-y-4 pt-4 border-t border-slate-200/20 mb-6">
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${modoOscuro ? "text-violet-400" : "text-slate-500"}`}>Cambiar Contraseña</label>
                <input type="password" value={contrasenaActual} onChange={(e) => setContrasenaActual(e.target.value)} placeholder="Contraseña Actual" className={`w-full rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all mb-3 ${modoOscuro ? "bg-[#111625] border-transparent text-white focus:ring-2 focus:ring-violet-500" : "bg-slate-50 border-slate-100 text-slate-800 focus:ring-2 focus:ring-slate-900"}`} required />
                <input type="password" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} placeholder="Nueva Contraseña (Mínimo 6)" className={`w-full rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all ${modoOscuro ? "bg-[#111625] border-transparent text-white focus:ring-2 focus:ring-violet-500" : "bg-slate-50 border-slate-100 text-slate-800 focus:ring-2 focus:ring-slate-900"}`} required minLength={6} />
              </div>
              <button type="submit" disabled={cambiandoPass} className={`w-full mt-2 font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest transition-all ${cambiandoPass ? "bg-slate-400 text-white" : (modoOscuro ? "bg-violet-600 hover:bg-violet-500 text-white" : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg")}`}>
                {cambiandoPass ? "Guardando..." : "Actualizar Contraseña"}
              </button>
            </form>
            
            <button onClick={cerrarSesion} className={`w-full font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest transition-all ${modoOscuro ? "bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30" : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"}`}>
               Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* MODAL QR AMPLIADO */}
      {qrAmpliado && (
        <div className="fixed inset-0 z-[200] bg-[#080A12]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in" onClick={() => setQrAmpliado(false)}>
          <div className={`p-8 rounded-[3rem] shadow-2xl flex flex-col items-center relative w-full max-w-sm animate-slide-up ${modoOscuro ? "bg-[#161B2C] border border-white/10" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-sm font-black mb-6 uppercase tracking-[0.2em] ${modoOscuro ? "text-white" : "text-slate-900"}`}>Escáner de Beneficio</h3>
            <div className="bg-white p-4 rounded-[2rem] shadow-[0_0_60px_rgba(124,58,237,0.25)] border-2 border-violet-100 mb-8">
              <QRCodeCanvas id="qr-joven" value={datosJoven.codigoUnicoQR} size={240} level="M" marginSize={4} />
            </div>
            <p className={`mb-6 break-all text-center font-mono text-[10px] font-black tracking-wider ${modoOscuro ? "text-slate-300" : "text-slate-600"}`}>{datosJoven.codigoUnicoQR}</p>
            <div className="flex w-full gap-3">
              <button onClick={() => setQrAmpliado(false)} className={`flex-1 font-black py-4.5 rounded-2xl text-[10px] uppercase tracking-widest transition-colors ${modoOscuro ? "bg-[#111625] text-slate-400" : "bg-slate-100 text-slate-500"}`}>Cerrar</button>
              <button onClick={descargarQR} className="flex-1 bg-violet-600 text-white font-black py-4.5 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-violet-900/30">Guardar QR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO NIVEL ALCANZADO */}
      {modalNivel && modalNivel.mostrar && (
        <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex justify-center items-center p-6 animate-fade-in" onClick={() => setModalNivel(null)}>
          <div className={`p-8 rounded-[3rem] shadow-[0_0_80px_rgba(255,215,0,0.2)] relative w-full max-w-sm text-center transform transition-all animate-slide-up bg-gradient-to-b ${modalNivel.nivelNuevo === "VIP Black" ? "from-slate-900 to-black border-2 border-fuchsia-500/50" : "from-yellow-50 to-white border-2 border-yellow-400"}`} onClick={e => e.stopPropagation()}>
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-[5rem] animate-bounce filter drop-shadow-2xl">
              {modalNivel.nivelNuevo === "VIP Black" ? "👑" : "⭐"}
            </div>
            <h2 className={`text-4xl font-black mt-8 mb-2 tracking-tighter ${modalNivel.nivelNuevo === "VIP Black" ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400" : "text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-700"}`}>
              ¡NUEVO ESTATUS!
            </h2>
            <p className={`text-xs font-black mb-6 uppercase tracking-widest ${modalNivel.nivelNuevo === "VIP Black" ? "text-slate-400" : "text-slate-500"}`}>
              Has alcanzado el {modalNivel.nivelNuevo}
            </p>
            <div className={`p-6 rounded-[2rem] mb-8 ${modalNivel.nivelNuevo === "VIP Black" ? "bg-white/5 border border-white/10 shadow-inner" : "bg-yellow-100/50 border border-yellow-200 shadow-inner"}`}>
              <p className={`text-[13px] font-medium leading-relaxed ${modalNivel.nivelNuevo === "VIP Black" ? "text-slate-300" : "text-slate-700"}`}>
                ¡Felicidades, {datosJoven.nombreCompleto.split(" ")[0]}! Con tus <span className="font-black text-lg">{modalNivel.visitas}</span> visitas acabas de evolucionar tu tarjeta. 
                <br/><br/>
                Ahora tienes acceso a <span className="font-black underline decoration-2 underline-offset-4">beneficios exclusivos</span> que están bloqueados para otros usuarios.
              </p>
            </div>
            <button onClick={() => setModalNivel(null)} className={`w-full font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 ${modalNivel.nivelNuevo === "VIP Black" ? "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-900/50" : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-yellow-900/40"}`}>
              Reclamar mi Estatus
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
