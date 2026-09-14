"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase"; 
import dynamic from "next/dynamic";
import imageCompression from 'browser-image-compression';
import "leaflet/dist/leaflet.css";

// Carga diferida del motor del mapa
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

// Carga diferida del escáner QR
const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-50">
      <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Iniciando Lente...</p>
    </div>
  )
});

export default function PortalNegocios() {
  const [datosNegocio, setDatosNegocio] = useState<any>(null);
  const [pestañaActiva, setPestañaActiva] = useState("escaner"); 
  const [modoOscuro, setModoOscuro] = useState(false);
  
  const [modoEscaner, setModoEscaner] = useState(false);
  const [jovenEscaneado, setJovenEscaneado] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [registrandoVisita, setRegistrandoVisita] = useState(false);
  const [promoAplicada, setPromoAplicada] = useState("");

  const [historialVisitas, setHistorialVisitas] = useState<any[]>([]);
  const [cargandoMetricas, setCargandoMetricas] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().substring(0, 7));

  const [listaEmpleos, setListaEmpleos] = useState<any[]>([]);
  const [listaPromos, setListaPromos] = useState<any[]>([]);
  
  const [creandoModal, setCreandoModal] = useState<"promo" | "empleo" | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [sueldo, setSueldo] = useState("");
  const [tipoEmpleo, setTipoEmpleo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoPromo, setTipoPromo] = useState("");
  const [visitasRequeridas, setVisitasRequeridas] = useState("");
  const [diasValidos, setDiasValidos] = useState("Todos los días");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [usoUnico, setUsoUnico] = useState(false);
  const [nivelRequerido, setNivelRequerido] = useState("Clásica");

  const [imgPromoFile, setImgPromoFile] = useState<File | null>(null);
  const [imgPromoPreview, setImgPromoPreview] = useState<string | null>(null);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuPreview, setMenuPreview] = useState<string | null>(null);
  const [guardandoMenu, setGuardandoMenu] = useState(false);
  const [publicandoPromo, setPublicandoPromo] = useState(false);

  const [modalAjustes, setModalAjustes] = useState(false);
  const [contrasenaActualInput, setContrasenaActualInput] = useState(""); 
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [cambiandoPass, setCambiandoPass] = useState(false);

  const [modalEditarPerfil, setModalEditarPerfil] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editGiro, setEditGiro] = useState("");
  const [editHorario, setEditHorario] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [editLat, setEditLat] = useState(23.92173);
  const [editLng, setEditLng] = useState(-106.89264);

  const [modalAuth, setModalAuth] = useState<{abierto: boolean, accion: Function | null}>({abierto: false, accion: null});
  const [passAuth, setPassAuth] = useState("");
  const [ultimaVisitaId, setUltimaVisitaId] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<any[]>([]); 
  const [modalAvisos, setModalAvisos] = useState(false);
  const [avisosNoLeidos, setAvisosNoLeidos] = useState(0);

  const [imagenCompleta, setImagenCompleta] = useState<string | null>(null);

  const router = useRouter();
  const audioExito = useRef<HTMLAudioElement | null>(null);
  const audioError = useRef<HTMLAudioElement | null>(null);

  const jerarquiaPromos = { "Clásica": 1, "Oro": 2, "Black": 3 };

  // -------------------------------------------------------------
  // NUEVO: Función maestra que actualiza el Centinela en Firebase
  // -------------------------------------------------------------
  const actualizarCentinela = async () => {
    try {
      await setDoc(doc(db, "sistema", "estado"), { 
        ultimaActualizacion: Date.now() 
      }, { merge: true });
    } catch (error) {
      console.error("Error al actualizar centinela:", error);
    }
  };

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

  useEffect(() => {
    const sesionGuardada = localStorage.getItem("sesionNegocio");
    if (sesionGuardada) { 
       const parsed = JSON.parse(sesionGuardada);
       setDatosNegocio(parsed); 
       setMenuPreview(parsed.menuImagen || null); 
    } else { 
       router.push("/login-negocio"); 
    }
    
    const temaGuardado = localStorage.getItem("temaNegocios");
    if (temaGuardado === "oscuro") {
      setModoOscuro(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    audioExito.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
    audioError.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3");
  }, [router]);

  useEffect(() => { if (datosNegocio) { cargarEstadisticas(); cargarEmpleos(); cargarPromos(); cargarAvisos(); } }, [pestañaActiva, datosNegocio]);
  useEffect(() => { if (ultimaVisitaId) { const timer = setTimeout(() => setUltimaVisitaId(null), 8000); return () => clearTimeout(timer); } }, [ultimaVisitaId]);

  const alternarTema = () => {
    if (modoOscuro) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("temaNegocios", "claro");
      setModoOscuro(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("temaNegocios", "oscuro");
      setModoOscuro(true);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("sesionNegocio");
    setModalAjustes(false);
    router.replace("/");
    setTimeout(() => {
      window.location.reload(); 
    }, 100);
  };

  const iniciarEscaner = () => {
    if (audioExito.current) { audioExito.current.play().then(() => { audioExito.current!.pause(); audioExito.current!.currentTime = 0; }).catch(()=>{}); }
    if (audioError.current) { audioError.current.play().then(() => { audioError.current!.pause(); audioError.current!.currentTime = 0; }).catch(()=>{}); }
    setModoEscaner(true);
  };

  const procesarQR = async (codigoQR: string) => {
    if (buscando) return; 
    setBuscando(true);
    
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(150); 
    }

    try {
      const res = await getDocs(query(collection(db, "jovenes"), where("codigoUnicoQR", "==", codigoQR)));
      if (res.empty) { 
         audioError.current?.play().catch(()=>{}); 
         alert("❌ Código no válido."); 
         setModoEscaner(true); 
      } else {
        let dataJoven: any = { idFirebase: res.docs[0].id, ...res.docs[0].data() };
        const snapVisitas = await getDocs(query(collection(db, "visitas"), where("idJoven", "==", dataJoven.idFirebase)));
        
        const fechaActual = new Date(); let visitasActivas = 0;
        snapVisitas.forEach(v => {
          const d = v.data();
          const diasTranscurridos = (fechaActual.getTime() - new Date(d.fecha).getTime()) / (1000 * 3600 * 24);
          if (diasTranscurridos <= 90) visitasActivas++;
        });

        let esCumpleHoy = false;
        if(dataJoven.fechaNacimiento) {
           const cumple = new Date(dataJoven.fechaNacimiento);
           if(cumple.getUTCMonth() === fechaActual.getMonth() && cumple.getUTCDate() === fechaActual.getDate()) { esCumpleHoy = true; }
        }

        dataJoven.visitasTotales = visitasActivas;
        dataJoven.nivelUserNum = visitasActivas >= 40 ? 3 : (visitasActivas >= 15 ? 2 : 1);
        dataJoven.nivelNombre = visitasActivas >= 40 ? "Black" : (visitasActivas >= 15 ? "Oro" : "Clásica");
        dataJoven.esCumple = esCumpleHoy;

        audioExito.current?.play().catch(()=>{}); 
        setJovenEscaneado(dataJoven); 
        setPromoAplicada(""); 
        setModoEscaner(false);
      }
    } catch (error) { 
      audioError.current?.play().catch(()=>{}); 
    }
    setBuscando(false);
  };

  const solicitarAutorizacion = (accionBloqueada: Function) => { setModalAuth({ abierto: true, accion: accionBloqueada }); };

  const verificarAutorizacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (passAuth === datosNegocio.contrasena) {
      if (modalAuth.accion) modalAuth.accion();
      setModalAuth({ abierto: false, accion: null }); setPassAuth("");
    } else { alert("❌ Contraseña de dueño incorrecta."); setPassAuth(""); }
  };

  const cargarAvisos = async () => {
      const snapAvisos = await getDocs(query(collection(db, "anuncios")));
      const aTemp: any[] = [];
      snapAvisos.forEach((d) => {
        const data = d.data();
        if(data.audiencia === "Todos" || data.audiencia === "Negocios") { aTemp.push({ idFirebase: d.id, ...data }); }
      });
      aTemp.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setAvisos(aTemp);
      const vistos = JSON.parse(localStorage.getItem("avisosVistosNegocio") || "[]");
      const noLeidos = aTemp.filter(a => !vistos.includes(a.idFirebase)).length;
      setAvisosNoLeidos(noLeidos);
      if (noLeidos > 0) setModalAvisos(true);
  }

  const cerrarModalAvisos = () => {
    const todosIds = avisos.map(a => a.idFirebase);
    localStorage.setItem("avisosVistosNegocio", JSON.stringify(todosIds));
    setAvisosNoLeidos(0); setModalAvisos(false);
  };

  const cargarEstadisticas = async () => {
    if (!datosNegocio) return;
    setCargandoMetricas(true);
    const snap = await getDocs(query(collection(db, "visitas"), where("idNegocio", "==", datosNegocio.idFirebase)));
    const temp: any[] = [];
    snap.forEach((doc) => temp.push({ idVisita: doc.id, ...doc.data() }));
    temp.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    setHistorialVisitas(temp); setCargandoMetricas(false);
  };

  const cargarEmpleos = async () => {
    const snap = await getDocs(query(collection(db, "empleos"), where("idNegocio", "==", datosNegocio.idFirebase)));
    const temp: any[] = []; snap.forEach((d) => temp.push({ idFirebase: d.id, ...d.data() })); setListaEmpleos(temp);
  };

  const cargarPromos = async () => {
    const snap = await getDocs(query(collection(db, "promociones"), where("idNegocio", "==", datosNegocio.idFirebase)));
    const temp: any[] = []; snap.forEach((d) => temp.push({ idFirebase: d.id, ...d.data() })); setListaPromos(temp);
  };

  const registrarVisita = async () => {
    setRegistrandoVisita(true);
    const p = listaPromos.find(x => x.idFirebase === promoAplicada);
    
    if (p) {
      const promoNum = jerarquiaPromos[p.nivelRequerido as keyof typeof jerarquiaPromos] || 1;
      if (promoNum > jovenEscaneado.nivelUserNum) {
        audioError.current?.play().catch(()=>{}); alert(`❌ BLOQUEADO:\nJoven es Nivel ${jovenEscaneado.nivelNombre}. Promo exclusiva para Nivel ${p.nivelRequerido}.`); setRegistrandoVisita(false); return;
      }
      if (p.tipo === "Cumpleaños" && !jovenEscaneado.esCumple) {
        audioError.current?.play().catch(()=>{}); alert(`❌ RECHAZADA:\nPromo exclusiva para festejados. Hoy no es su cumpleaños.`); setRegistrandoVisita(false); return;
      }

      const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const hoyTexto = dias[new Date().getDay()];
      const esFinDeSemana = hoyTexto === "Sábado" || hoyTexto === "Domingo";
      const esSemana = !esFinDeSemana;
      
      let bloqueadaPorDia = false;
      if (p.diasValidos) {
        if (p.diasValidos === "Fines de semana" && !esFinDeSemana) bloqueadaPorDia = true;
        else if (p.diasValidos === "Lunes a Viernes" && !esSemana) bloqueadaPorDia = true;
        else if (p.diasValidos.startsWith("Solo ") && p.diasValidos !== `Solo ${hoyTexto}`) bloqueadaPorDia = true;
      }

      if (bloqueadaPorDia) { audioError.current?.play().catch(()=>{}); alert(`❌ RECHAZADA:\nPromo válida solo: ${p.diasValidos}. Hoy es ${hoyTexto}.`); setRegistrandoVisita(false); return; }
      if (p.tipo === "Directa" && p.usoUnico) {
        if (historialVisitas.some(v => v.idJoven === jovenEscaneado.idFirebase && v.idPromo === p.idFirebase)) {
          audioError.current?.play().catch(()=>{}); alert("❌ RECHAZADA:\nEste joven ya usó este cupón de Único Uso."); setRegistrandoVisita(false); return;
        }
      }
    }

    try {
      const docRef = await addDoc(collection(db, "visitas"), {
        idNegocio: datosNegocio.idFirebase, nombreNegocio: datosNegocio.nombreComercial, idJoven: jovenEscaneado.idFirebase, nombreJoven: jovenEscaneado.nombreCompleto,
        generoJoven: jovenEscaneado.genero || "No especificado", idPromo: promoAplicada || "ninguna", nombrePromo: p ? p.titulo : "Visita estándar", fecha: new Date().toISOString()
      });
      audioExito.current?.play().catch(()=>{}); setJovenEscaneado(null); setPromoAplicada(""); setUltimaVisitaId(docRef.id); cargarEstadisticas();
    } catch (e) { audioError.current?.play().catch(()=>{}); }
    setRegistrandoVisita(false);
  };

  const deshacerUltimaVisita = async () => {
    if (!ultimaVisitaId) return;
    try { await deleteDoc(doc(db, "visitas", ultimaVisitaId)); setUltimaVisitaId(null); cargarEstadisticas(); alert("✅ Movimiento deshecho."); } 
    catch(e) { alert("Error al deshacer el movimiento."); }
  };

  const limpiarFormulario = () => { setTitulo(""); setDescripcion(""); setDireccion(""); setSueldo(""); setTipoEmpleo(""); setTelefono(""); setTipoPromo(""); setVisitasRequeridas(""); setDiasValidos("Todos los días"); setFechaVencimiento(""); setUsoUnico(false); setNivelRequerido("Clásica"); setCreandoModal(null); setImgPromoFile(null); setImgPromoPreview(null); };

  const manejarSubidaArchivo = async (e: React.ChangeEvent<HTMLInputElement>, tipo: "promo" | "menu" | "logo") => {
    const file = e.target.files?.[0];
    if (file) {
      const opciones = {
        maxSizeMB: 0.4, 
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      try {
        const compressedFile = await imageCompression(file, opciones);
        const urlTemporal = URL.createObjectURL(compressedFile);

        if (tipo === "promo") { setImgPromoFile(compressedFile as File); setImgPromoPreview(urlTemporal); } 
        else if (tipo === "menu") { setMenuFile(compressedFile as File); setMenuPreview(urlTemporal); } 
        else if (tipo === "logo") { setEditLogoFile(compressedFile as File); setEditLogoPreview(urlTemporal); }
      } catch (error) {
        console.error("Error comprimiendo imagen:", error);
        alert("Ocurrió un error al optimizar la imagen. Intenta con otra.");
      }
    }
  };

  const abrirEditarPerfil = () => {
    setEditNombre(datosNegocio.nombreComercial || ""); 
    setEditGiro(datosNegocio.giro || ""); 
    setEditLogoPreview(datosNegocio.logo || null);
    setEditLat(datosNegocio.lat || 23.92173); 
    setEditLng(datosNegocio.lng || -106.89264);
    setEditHorario(datosNegocio.horario || "");
    setEditTelefono(datosNegocio.telefono || "");

    setModalAjustes(false); 
    setModalEditarPerfil(true); 
  };

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editNombre || !editGiro) return;
    setGuardandoPerfil(true);
    try {
      let nuevaUrlLogo = datosNegocio.logo;
      if (editLogoFile) {
         const storageRef = ref(storage, `negocios_logos/${Date.now()}_${editLogoFile.name}`); await uploadBytes(storageRef, editLogoFile); nuevaUrlLogo = await getDownloadURL(storageRef);
      }
      
      await updateDoc(doc(db, "negocios", datosNegocio.idFirebase), { 
          nombreComercial: editNombre.trim(), 
          giro: editGiro.trim(), 
          logo: nuevaUrlLogo, 
          lat: editLat, 
          lng: editLng,
          horario: editHorario.trim(),
          telefono: editTelefono.trim()
      });
      
      await actualizarCentinela(); // DISPARAMOS CENTINELA

      const datosActualizados = { 
          ...datosNegocio, 
          nombreComercial: editNombre.trim(), 
          giro: editGiro.trim(), 
          logo: nuevaUrlLogo, 
          lat: editLat, 
          lng: editLng,
          horario: editHorario.trim(),
          telefono: editTelefono.trim()
      };

      localStorage.setItem("sesionNegocio", JSON.stringify(datosActualizados)); setDatosNegocio(datosActualizados);
      alert("✅ Perfil actualizado exitosamente en el Directorio."); setModalEditarPerfil(false);
    } catch (error) { alert("Error al actualizar el perfil."); }
    setGuardandoPerfil(false);
  };

  const publicarEmpleo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "empleos"), { idNegocio: datosNegocio.idFirebase, nombreNegocio: datosNegocio.nombreComercial, logoNegocio: datosNegocio.logo || null, titulo: titulo.trim(), sueldo: sueldo.trim(), tipo: tipoEmpleo, descripcion: descripcion.trim(), telefonoContacto: telefono.trim(), direccion: direccion.trim(), estatus: "Activa", fechaPublicacion: new Date().toISOString() });
      
      await actualizarCentinela(); // DISPARAMOS CENTINELA
      
      alert("¡Vacante publicada!"); limpiarFormulario(); cargarEmpleos(); 
    } catch (error) { alert("Error al publicar."); }
  };

  const publicarPromo = async (e: React.FormEvent) => {
    e.preventDefault(); setPublicandoPromo(true);
    try {
      let imageUrl = null;
      if (imgPromoFile) { const storageRef = ref(storage, `promociones/${Date.now()}_${imgPromoFile.name}`); await uploadBytes(storageRef, imgPromoFile); imageUrl = await getDownloadURL(storageRef); }
      await addDoc(collection(db, "promociones"), {
        idNegocio: datosNegocio.idFirebase, nombreNegocio: datosNegocio.nombreComercial, logoNegocio: datosNegocio.logo || null, titulo: titulo.trim(), tipo: tipoPromo, descripcion: descripcion.trim(), direccion: direccion.trim(), visitasMeta: tipoPromo === "Frecuente" ? parseInt(visitasRequeridas) : null, diasValidos: diasValidos, fechaVencimiento: fechaVencimiento || null, usoUnico: tipoPromo === "Directa" ? usoUnico : false, nivelRequerido: nivelRequerido, imagen: imageUrl, estatus: "Activa", fechaPublicacion: new Date().toISOString()
      });
      
      await actualizarCentinela(); // DISPARAMOS CENTINELA
      
      alert("¡Promoción activada con éxito!"); limpiarFormulario(); cargarPromos(); 
    } catch (error) { alert("Error al guardar."); }
    setPublicandoPromo(false);
  };

  const guardarMenu = async () => {
    if (!menuFile) { alert("Selecciona una imagen de menú."); return; }
    setGuardandoMenu(true);
    try {
      const storageRef = ref(storage, `menus/${Date.now()}_${menuFile.name}`); await uploadBytes(storageRef, menuFile); const menuUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "negocios", datosNegocio.idFirebase), { menuImagen: menuUrl });
      
      await actualizarCentinela(); // DISPARAMOS CENTINELA

      const datosActualizados = { ...datosNegocio, menuImagen: menuUrl };
      localStorage.setItem("sesionNegocio", JSON.stringify(datosActualizados)); setDatosNegocio(datosActualizados); setMenuFile(null);
      alert("¡Menú actualizado y visible en el directorio!");
    } catch (error) { alert("Hubo un error al guardar el menú."); }
    setGuardandoMenu(false);
  };

  // NUEVA: Función genérica para eliminar (y actualizar centinela)
  const eliminarPublicacion = async (item: any, coleccion: string) => {
    if(window.confirm("¿Seguro que deseas eliminar esta publicación permanentemente?")) {
      try {
        await deleteDoc(doc(db, coleccion, item.idFirebase));
        await actualizarCentinela(); // DISPARAMOS CENTINELA
        
        if (coleccion === "promociones") await cargarPromos();
        else await cargarEmpleos();
        alert("Publicación eliminada.");
      } catch (error) {
        alert("Error al eliminar.");
      }
    }
  }

  const actualizarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contrasenaActualInput !== datosNegocio.contrasena) { alert("❌ Contraseña actual incorrecta."); return; }
    if (nuevaContrasena.length < 6) { alert("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    setCambiandoPass(true);
    try {
      await updateDoc(doc(db, "negocios", datosNegocio.idFirebase), { contrasena: nuevaContrasena });
      const datosActualizados = { ...datosNegocio, contrasena: nuevaContrasena };
      localStorage.setItem("sesionNegocio", JSON.stringify(datosActualizados)); setDatosNegocio(datosActualizados);
      alert("✅ ¡Contraseña actualizada!"); setModalAjustes(false); setContrasenaActualInput(""); setNuevaContrasena("");
    } catch (error) { alert("Error al actualizar."); }
    setCambiandoPass(false);
  };

  const descargarExcelEstadisticas = () => {
    let csvContent = "\uFEFFFecha,Joven,Género,Promoción\n";
    visitasFiltradas.forEach(v => { 
      const f = new Date(v.fecha).toLocaleString("es-MX"); const g = v.generoJoven || "No especificado";
      csvContent += `"${f}","${v.nombreJoven}","${g}","${v.nombrePromo}"\n`; 
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; 
    link.setAttribute("download", `Estadisticas_${datosNegocio.nombreComercial}_${mesSeleccionado}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const visitasFiltradas = historialVisitas.filter(v => v.fecha.startsWith(mesSeleccionado));

  if (!datosNegocio) return null;

  return (
    <main className={`min-h-screen pb-32 font-sans selection:bg-emerald-500/30 relative transition-colors duration-300 ${modoOscuro ? 'bg-slate-900 text-slate-100' : 'bg-[#F3F5F9] text-slate-900'}`}>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer { 0% { transform: translateX(-150%); } 100% { transform: translateX(150%); } }
        @keyframes slide-up { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @media (pointer: fine) { 
          .scroll-estetico::-webkit-scrollbar { width: 6px; height: 6px; }
          .scroll-estetico::-webkit-scrollbar-track { background: transparent; }
          .scroll-estetico::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.4); border-radius: 10px; }
          .scroll-estetico:hover::-webkit-scrollbar-thumb { background-color: rgba(16, 185, 129, 0.6); } 
        }
        @media (pointer: coarse) { 
          .scroll-estetico::-webkit-scrollbar { display: none; }
          .scroll-estetico { -ms-overflow-style: none; scrollbar-width: none; }
        }
      `}} />

      {imagenCompleta && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col justify-center items-center p-4 animate-fade-in" onClick={() => setImagenCompleta(null)}>
          <button onClick={() => setImagenCompleta(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors z-10">✕</button>
          <img src={imagenCompleta} alt="Vista Completa" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {modalAuth.abierto && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex justify-center items-center p-6 animate-fade-in" onClick={() => setModalAuth({abierto: false, accion: null})}>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative w-full max-w-sm text-center animate-slide-up" onClick={e => e.stopPropagation()}>
             <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🔒</div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Autorización Requerida</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">Esta acción está protegida para evitar que empleados modifiquen los beneficios sin tu permiso.</p>
             <form onSubmit={verificarAutorizacion}>
               <input type="password" value={passAuth} onChange={(e) => setPassAuth(e.target.value)} placeholder="Contraseña del Negocio" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-4 text-center text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#D65F08] dark:focus:border-orange-400 mb-4" autoFocus required />
               <div className="flex gap-2">
                 <button type="button" onClick={() => setModalAuth({abierto: false, accion: null})} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
                 <button type="submit" className="flex-1 bg-[#D65F08] text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 dark:hover:bg-orange-900 transition-colors">Desbloquear</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {ultimaVisitaId && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between animate-slide-up border border-slate-700">
          <div className="flex items-center gap-3"><span className="text-emerald-400 text-xl">✅</span><p className="text-xs font-bold leading-tight">Visita registrada.</p></div>
          <button onClick={deshacerUltimaVisita} className="bg-slate-700 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-colors">Deshacer</button>
        </div>
      )}

      {/* HEADER */}
      <div className="pt-6 pb-6 px-6 max-w-md mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center">
             <img src={datosNegocio.logo || "/imju-elota.webp"} alt="IMJU" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <p className="text-[#D65F08] dark:text-orange-400 text-[11px] font-black uppercase tracking-widest mb-0.5">Portal Aliado</p>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter truncate max-w-[150px] leading-tight">{datosNegocio.nombreComercial}</h1>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={alternarTema} className="w-11 h-11 bg-white dark:bg-slate-800 rounded-[1.2rem] flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-300 transition-colors text-lg">
             {modoOscuro ? "☀️" : "🌙"}
          </button>

          <button onClick={() => setModalAvisos(true)} className="relative w-11 h-11 bg-white dark:bg-slate-800 rounded-[1.2rem] flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-300 hover:text-[#D65F08] dark:hover:text-orange-400 transition-colors text-lg">
             🔔
             {avisosNoLeidos > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>}
          </button>
          
          <button onClick={() => setModalAjustes(true)} className="w-11 h-11 bg-white dark:bg-slate-800 rounded-[1.2rem] flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors">⚙️</button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-4 relative z-20">
        
        {/* PANEL ESCÁNER */}
        {pestañaActiva === "escaner" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl dark:shadow-none p-8 text-center border border-slate-50 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              <h2 className="text-sm font-black text-[#D65F08] dark:text-orange-400 mb-8 uppercase tracking-[0.3em]">Validación TPV</h2>
              
              {!modoEscaner && !jovenEscaneado && (
                <button onClick={iniciarEscaner} className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-black py-8 rounded-[2.5rem] shadow-xl shadow-emerald-500/30 w-full flex flex-col items-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">📷</div>
                  <span className="text-xs uppercase tracking-[0.2em] drop-shadow-md">Escanear Tarjeta</span>
                </button>
              )}

              {modoEscaner && (
                <div className="animate-fade-in">
                  <div className="rounded-[2.5rem] overflow-hidden border-4 border-emerald-500 mb-6 aspect-square shadow-[0_0_50px_rgba(16,185,129,0.3)] bg-slate-900 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 z-0"></div>
                    <div className="relative z-10 w-full h-full">
                      <Scanner onScan={(res) => res && res.length > 0 && procesarQR(res[0].rawValue)} formats={['qr_code']} />
                    </div>
                  </div>
                  <button onClick={() => setModoEscaner(false)} className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-6 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancelar Escaneo</button>
                </div>
              )}

              {jovenEscaneado && (
                <div className="animate-fade-in bg-emerald-50/30 dark:bg-emerald-900/10 p-4 md:p-6 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800/50">
                  
                  {jovenEscaneado.esCumple && (
                     <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white font-black uppercase tracking-widest text-[10px] py-2 px-4 rounded-full mb-4 animate-bounce shadow-lg">
                       🎂 ¡Es su cumpleaños hoy! 🎉
                     </div>
                  )}

                  <div className="relative inline-block mb-3">
                    <img src={jovenEscaneado.fotoPerfil} className={`w-20 h-20 rounded-[1.5rem] object-cover border-4 shadow-lg ${jovenEscaneado.esCumple ? 'border-orange-400' : 'border-white dark:border-slate-700'}`} alt="Joven" />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-slate-800">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 tracking-tight leading-tight">{jovenEscaneado.nombreCompleto}</h3>
                  <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Identidad Verificada</p>
                  
                  <span className={`inline-block mb-6 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${jovenEscaneado.nivelNombre === 'Black' ? 'bg-slate-900 text-fuchsia-400 shadow-md' : jovenEscaneado.nivelNombre === 'Oro' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    Nivel del Cliente: {jovenEscaneado.nivelNombre}
                  </span>
                  
                  <div className="text-left space-y-3 bg-white dark:bg-slate-800 p-4 md:p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Selecciona el movimiento:</label>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scroll-estetico">
                      <div 
                        onClick={() => setPromoAplicada("")} 
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${promoAplicada === "" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600"}`}
                      >
                        <span className={`font-bold text-sm ${promoAplicada === "" ? "text-emerald-800 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}`}>Solo sumar visita (Sin Promo)</span>
                        {promoAplicada === "" && <span className="text-emerald-500 text-lg">✅</span>}
                      </div>

                      {listaPromos.map(p => {
                        const promoNum = jerarquiaPromos[p.nivelRequerido as keyof typeof jerarquiaPromos] || 1;
                        let bloqueadaPorNivel = promoNum > jovenEscaneado.nivelUserNum;
                        let bloqueadaPorCumple = p.tipo === "Cumpleaños" && !jovenEscaneado.esCumple;

                        const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                        const hoyTexto = diasSemana[new Date().getDay()];
                        const esFinDeSemana = hoyTexto === "Sábado" || hoyTexto === "Domingo";
                        const esSemana = !esFinDeSemana;
                        
                        let bloqueadaPorDia = false; let mensajeDia = "";
                        if (p.diasValidos) {
                          if (p.diasValidos === "Fines de semana" && !esFinDeSemana) { bloqueadaPorDia = true; mensajeDia = "Solo Fines de Semana"; }
                          else if (p.diasValidos === "Lunes a Viernes" && !esSemana) { bloqueadaPorDia = true; mensajeDia = "Solo Lun-Vie"; }
                          else if (p.diasValidos.startsWith("Solo ") && p.diasValidos !== `Solo ${hoyTexto}`) { bloqueadaPorDia = true; mensajeDia = p.diasValidos; }
                        }

                        const bloqueada = bloqueadaPorNivel || bloqueadaPorDia || bloqueadaPorCumple;
                        const isSelected = promoAplicada === p.idFirebase;
                        
                        const visitasRequeridas = p.nivelRequerido === 'Black' ? 40 : 15;
                        const visitasFaltantes = visitasRequeridas - jovenEscaneado.visitasTotales;

                        return (
                          <div 
                            key={p.idFirebase} 
                            onClick={() => {
                              if(bloqueadaPorNivel) { audioError.current?.play().catch(()=>{}); alert(`🔒 PROMOCIÓN BLOQUEADA:\nCliente debe ser Nivel ${p.nivelRequerido}.\nLe faltan ${visitasFaltantes} visitas.`); } 
                              else if (bloqueadaPorCumple) { audioError.current?.play().catch(()=>{}); alert(`🔒 BLOQUEO CUMPLEAÑERO:\nExclusiva para el día del cumpleaños.`); } 
                              else if (bloqueadaPorDia) { audioError.current?.play().catch(()=>{}); alert(`🔒 BLOQUEO DE DÍA:\nRegla: ${p.diasValidos}`); } 
                              else { setPromoAplicada(p.idFirebase); }
                            }}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 relative overflow-hidden ${bloqueada ? "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 opacity-70 cursor-not-allowed" : isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-md cursor-pointer" : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 cursor-pointer"}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <p className={`font-black text-sm leading-tight ${bloqueada ? "text-slate-500 dark:text-slate-400" : (isSelected ? "text-emerald-800 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200")}`}>
                                {p.titulo}
                              </p>
                              {isSelected && <span className="text-emerald-500 text-lg flex-shrink-0">✅</span>}
                              {bloqueada && <span className="text-slate-400 text-lg flex-shrink-0">🔒</span>}
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                              {bloqueadaPorDia ? (
                                 <span className="text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">Hoy no aplica ({mensajeDia})</span>
                              ) : bloqueadaPorCumple ? (
                                 <span className="text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">No es Cumpleañero</span>
                              ) : (
                                <>
                                  <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest ${p.nivelRequerido === 'Black' ? 'bg-slate-900 text-fuchsia-400' : p.nivelRequerido === 'Oro' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
                                    Req. {p.nivelRequerido}
                                  </span>
                                  {bloqueadaPorNivel && (
                                    <span className="text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">Faltan {visitasFaltantes} Visitas</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <button onClick={registrarVisita} disabled={registrandoVisita} className={`w-full text-white font-black py-5 rounded-[2rem] shadow-lg mt-6 uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 ${registrandoVisita ? "bg-slate-400" : "bg-[#D65F08] hover:bg-slate-900 hover:shadow-xl hover:-translate-y-1"}`}>
                    {registrandoVisita ? "Procesando..." : "Confirmar Movimiento"}
                  </button>
                  <button onClick={() => setJovenEscaneado(null)} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mt-6 tracking-widest hover:text-slate-600 dark:hover:text-slate-300 w-full">Cerrar</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL MENÚ */}
        {pestañaActiva === "menu" && (
           <div className="animate-fade-in bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl p-6 border border-slate-100 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-orange-100 dark:border-orange-800">📖</div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Mi Menú / Catálogo</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">Esta imagen aparecerá en el Directorio de la Tarjeta Joven para que puedan ver qué ofreces.</p>

              {!menuPreview ? (
                 <label className="bg-slate-50 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-[2.5rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                    <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📸</span>
                    <span className="text-[#D65F08] dark:text-orange-400 font-black uppercase tracking-widest text-[10px]">Seleccionar Imagen</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-bold">JPG o PNG</span>
                    <input type="file" accept="image/*" onChange={(e) => manejarSubidaArchivo(e, "menu")} className="hidden" />
                 </label>
              ) : (
                 <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-600">
                    <div className="w-full max-w-[200px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-600 mb-4 cursor-pointer relative group" onClick={() => setImagenCompleta(menuPreview)}>
                       <img src={menuPreview} alt="Menú" className="w-full object-contain bg-white group-hover:scale-105 transition-transform" />
                       <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] bg-white text-slate-900 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest">Ampliar</span>
                       </div>
                    </div>
                    
                    <div className="flex gap-2 w-full flex-col mt-2">
                       <label className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-black py-3.5 rounded-xl cursor-pointer text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center shadow-sm">
                         🔄 Cambiar Foto <input type="file" accept="image/*" onChange={(e) => manejarSubidaArchivo(e, "menu")} className="hidden" />
                       </label>
                       <button onClick={guardarMenu} disabled={guardandoMenu || !menuFile} className={`w-full text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-md ${guardandoMenu || !menuFile ? "bg-slate-400 dark:bg-slate-600" : "bg-[#D65F08] hover:bg-slate-900"}`}>
                          {guardandoMenu ? "Guardando..." : "✅ Guardar en Directorio"}
                       </button>
                    </div>
                 </div>
              )}
           </div>
        )}

        {/* PANEL ESTADÍSTICAS */}
        {pestañaActiva === "estadisticas" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Reporte Mensual</h2>
              <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="text-xs font-black text-[#D65F08] dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-4 py-2.5 rounded-xl outline-none border border-orange-100 dark:border-orange-800/50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-lg shadow-slate-200/50 dark:shadow-none text-center border border-slate-50 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-5 dark:opacity-10">📈</div>
                <p className="text-5xl font-black text-[#D65F08] dark:text-orange-400 tracking-tighter">{visitasFiltradas.length}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase mt-2 tracking-widest">Visitas Totales</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-lg shadow-slate-200/50 dark:shadow-none text-center border border-slate-50 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-5 dark:opacity-10">👥</div>
                <p className="text-5xl font-black text-emerald-500 dark:text-emerald-400 tracking-tighter">{new Set(visitasFiltradas.map(v => v.idJoven)).size}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase mt-2 tracking-widest">Clientes Únicos</p>
              </div>

              {visitasFiltradas.length > 0 && (
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 col-span-2">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">Demografía por Género</h3>
                    <div className="flex justify-around items-center pt-2">
                       {['Mujer', 'Hombre', 'No Binario'].map(gen => {
                          const cantidad = visitasFiltradas.filter(v => v.generoJoven === gen).length;
                          return (
                              <div key={gen} className="text-center">
                                <p className="text-2xl font-black text-slate-700 dark:text-slate-200">{cantidad}</p>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">{gen}</p>
                              </div>
                          );
                       })}
                    </div>
                 </div>
              )}
            </div>

            {visitasFiltradas.length > 0 && (
              <div className="space-y-4">
                <button onClick={descargarExcelEstadisticas} className="w-full bg-[#107C41] hover:bg-green-700 text-white font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-colors active:scale-95">
                    📊 Descargar Excel
                </button>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2"><span className="text-lg">🔥</span> Promociones más exitosas</h3>
                  <div className="space-y-4">
                    {Object.entries(visitasFiltradas.reduce((acc: any, v: any) => { acc[v.nombrePromo] = (acc[v.nombrePromo] || 0) + 1; return acc; }, {}))
                      .sort((a: any, b: any) => b[1] - a[1]).slice(0, 3)
                      .map((item: any, idx: number) => {
                        const nombre = item[0]; const cantidad = item[1];
                        return (
                        <div key={nombre}>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-700 dark:text-slate-200 truncate pr-4">{idx + 1}. {nombre}</span>
                            <span className="text-[#D65F08] dark:text-orange-400 font-black">{cantidad}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-400 to-[#D65F08] dark:from-orange-500 dark:to-orange-800 rounded-full" style={{ width: `${(cantidad / visitasFiltradas.length) * 100}%` }}></div>
                          </div>
                        </div>
                      )})}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-[#0a1128] dark:from-slate-800 dark:to-slate-900 p-6 rounded-[2.5rem] shadow-lg flex items-center justify-between border border-slate-700">
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Día con más clientes</p>
                    <p className="text-2xl font-black text-white">
                      {(() => {
                        const conteo: any = visitasFiltradas.reduce((acc: any, v: any) => { const d = new Date(v.fecha).getDay(); acc[d] = (acc[d] || 0) + 1; return acc; }, {});
                        const diaPico = Object.keys(conteo).reduce((a: any, b: any) => conteo[a] > conteo[b] ? a : b);
                        return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][parseInt(diaPico)];
                      })()}
                    </p>
                  </div>
                  <div className="text-4xl drop-shadow-lg">📅</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL PROMOS Y EMPLEOS */}
        {(pestañaActiva === "promos" || pestañaActiva === "empleos") && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center px-2 mb-2">
               <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{pestañaActiva === "promos" ? "Mis Cupones Activos" : "Bolsa de Trabajo"}</h2>
               <button onClick={() => solicitarAutorizacion(() => setCreandoModal(pestañaActiva === "promos" ? "promo" : "empleo"))} className="bg-[#D65F08] dark:bg-slate-800 text-white dark:text-orange-400 px-5 py-3.5 rounded-[1rem] shadow-lg hover:shadow-xl hover:bg-slate-900 dark:hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest border border-transparent dark:border-orange-900/50">
                 + Nuevo
               </button>
            </div>
            
            {(pestañaActiva === "promos" ? listaPromos : listaEmpleos).length === 0 ? (
               <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 border-dashed">
                 <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No tienes publicaciones activas.</p>
               </div>
            ) : (
              (pestañaActiva === "promos" ? listaPromos : listaEmpleos).map((item: any) => {
                const hoy = new Date().toISOString().split("T")[0];
                const estaExpirado = item.fechaVencimiento && item.fechaVencimiento < hoy;
                
                return (
                  <div key={item.idFirebase} className={`bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm p-7 border relative group transition-all hover:shadow-lg ${estaExpirado ? "border-red-200 dark:border-red-900/50 opacity-75" : "border-slate-100 dark:border-slate-700 hover:border-emerald-100 dark:hover:border-emerald-800"}`}>
                    <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${estaExpirado ? "bg-red-400 dark:bg-red-700" : "bg-[#D65F08]/10 dark:bg-orange-500/20 group-hover:bg-[#D65F08] dark:group-hover:bg-orange-500"}`}></div>
                    
                    <button 
                      onClick={() => solicitarAutorizacion(() => eliminarPublicacion(item, pestañaActiva === "promos" ? "promociones" : "empleos"))} 
                      className="absolute top-5 right-6 w-9 h-9 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-[1rem] flex items-center justify-center transition-colors z-10 border border-slate-100 dark:border-slate-600"
                    >
                      🗑️
                    </button>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`${estaExpirado ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"} text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${estaExpirado ? "border-red-100 dark:border-red-800" : "border-emerald-100 dark:border-emerald-800"}`}>
                        {estaExpirado ? "Expirado" : "Activo"}
                      </span>
                      {item.usoUnico && <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-orange-100 dark:border-orange-800">1 Solo Uso</span>}
                      {item.tipo === "Cumpleaños" && <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-orange-100 dark:border-orange-800">Cumpleañero 🎂</span>}
                      {item.nivelRequerido && item.nivelRequerido !== "Clásica" && <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${item.nivelRequerido === 'Black' ? 'bg-slate-900 text-fuchsia-400 border border-slate-800' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700'}`}>Solo {item.nivelRequerido}</span>}
                    </div>
                    
                    {item.imagen && (
                       <div className="relative mb-5 cursor-pointer rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 group/img shadow-sm" onClick={() => setImagenCompleta(item.imagen)}>
                         <img src={item.imagen} alt="Promo" className="w-full h-44 object-contain transition-transform group-hover/img:scale-105" />
                         <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="text-[10px] bg-white text-slate-900 px-4 py-2 rounded-full font-bold uppercase tracking-widest">Ampliar Imagen</span>
                         </div>
                       </div>
                    )}

                    <h4 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight leading-tight pr-10">{item.titulo}</h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-2 mb-1"><span className="text-red-400 text-sm">📍</span> {item.direccion}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-4"><span className="text-blue-400 text-sm">📅</span> {item.diasValidos}</p>

                    <p className="text-sm font-medium text-slate-500 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/50 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-600">{item.descripcion}</p>
                    
                    {item.sueldo && <p className="text-xl font-black text-emerald-500 dark:text-emerald-400 mt-4">{item.sueldo}</p>}
                    {item.tipo === "Frecuente" && <p className="text-[10px] font-black bg-orange-50 dark:bg-orange-900/30 text-[#D65F08] dark:text-orange-400 inline-block px-3 py-1.5 rounded-lg mt-4 uppercase tracking-widest border border-orange-100 dark:border-orange-900">Meta: {item.visitasMeta} Visitas</p>}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL BANDEJA DE AVISOS */}
      {modalAvisos && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex justify-center items-end md:items-center animate-fade-in" onClick={cerrarModalAvisos}>
          <div className="p-6 md:p-8 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative w-full max-w-md h-[80vh] md:h-auto flex flex-col bg-[#F3F5F9] dark:bg-slate-900 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6 md:hidden"></div>
            <button onClick={cerrarModalAvisos} className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white dark:bg-slate-800 shadow-sm text-slate-400 dark:text-slate-300 hover:text-[#D65F08] dark:hover:text-orange-400 border border-slate-100 dark:border-slate-700">✕</button>
            
            <h3 className="text-2xl font-black mb-1 flex items-center gap-2 text-slate-900 dark:text-white tracking-tight">🔔 Bandeja</h3>
            <p className="text-[11px] font-black uppercase tracking-widest mb-6 text-slate-400 dark:text-slate-500">Comunicados IMJU</p>
            
            <div className="flex-1 overflow-y-auto scroll-estetico space-y-4 pr-1 pb-10">
               {avisos.length === 0 ? (
                  <p className="text-center py-10 text-sm font-bold text-slate-400 dark:text-slate-500">No tienes mensajes por ahora.</p>
               ) : (
                  avisos.map(a => {
                    const vistos = JSON.parse(localStorage.getItem("avisosVistosNegocio") || "[]");
                    const esNuevo = !vistos.includes(a.idFirebase);
                    return (
                      <div key={a.idFirebase} className={`p-6 rounded-[2rem] border-l-4 transition-all bg-white dark:bg-slate-800 shadow-sm ${esNuevo ? "border-l-[#D65F08] dark:border-l-orange-500" : "border-l-slate-200 dark:border-l-slate-700"}`}>
                         <div className="flex justify-between items-start mb-2">
                           <h4 className="font-black text-lg leading-tight pr-4 text-slate-800 dark:text-slate-100">{a.titulo}</h4>
                           {esNuevo && <span className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></span>}
                         </div>
                         <p className="text-sm font-medium leading-relaxed mb-4 text-slate-500 dark:text-slate-300">{a.mensaje}</p>
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{new Date(a.fecha).toLocaleDateString()}</p>
                      </div>
                    );
                  })
               )}
            </div>
            
            <div className="pt-4 mt-auto">
               <button onClick={cerrarModalAvisos} className="w-full font-black py-4.5 rounded-xl text-[11px] uppercase tracking-widest transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm active:scale-95">Cerrar Bandeja</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJUSTES */}
      {modalAjustes && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-6 animate-fade-in" onClick={() => setModalAjustes(false)}>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6 md:hidden"></div>
            <button onClick={() => setModalAjustes(false)} className="absolute top-6 right-6 w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors">✕</button>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Ajustes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">Administra tus datos y credenciales.</p>
            
            <button onClick={() => solicitarAutorizacion(abrirEditarPerfil)} className="w-full bg-[#D65F08] dark:bg-orange-900/50 text-white dark:text-orange-300 font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest shadow-lg mb-6 flex items-center justify-center gap-2 hover:bg-slate-900 dark:hover:bg-orange-900 transition-colors border border-transparent dark:border-orange-800 active:scale-95">
               ✏️ Perfil Público (Directorio)
            </button>

            <form onSubmit={actualizarContrasena} className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-700 mb-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500 dark:text-slate-400">Cambiar Contraseña</label>
                <input type="password" value={contrasenaActualInput} onChange={(e) => setContrasenaActualInput(e.target.value)} placeholder="Contraseña Actual" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#D65F08] dark:focus:border-orange-400 focus:ring-4 focus:ring-[#D65F08]/10 mb-3 transition-all" required />
                <input type="password" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} placeholder="Nueva Contraseña (Mínimo 6)" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#D65F08] dark:focus:border-orange-400 focus:ring-4 focus:ring-[#D65F08]/10 transition-all" required minLength={6} />
              </div>
              <button type="submit" disabled={cambiandoPass} className={`w-full font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest shadow-lg transition-all ${cambiandoPass ? "bg-slate-400 dark:bg-slate-600 text-white" : "bg-slate-900 dark:bg-slate-700 hover:bg-[#D65F08] dark:hover:bg-slate-600 text-white active:scale-95"}`}>
                {cambiandoPass ? "Guardando..." : "Actualizar Contraseña"}
              </button>
            </form>

            <button onClick={cerrarSesion} className="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-100 dark:border-red-900/50 active:scale-95">
               Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL CON MAPA */}
      {modalEditarPerfil && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-6 animate-fade-in" onClick={() => setModalEditarPerfil(false)}>
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl relative w-full max-w-md h-[90vh] md:max-h-[90vh] overflow-y-auto scroll-estetico animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6 md:hidden"></div>
            <button onClick={() => setModalEditarPerfil(false)} className="absolute top-6 right-6 w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors z-50">✕</button>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Perfil Público</h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Estos datos son los que los jóvenes verán en la sección "Directorio" de su aplicación.</p>
            
            <form onSubmit={guardarPerfil} className="space-y-5 pb-10">
               <div className="flex flex-col items-center mb-6 bg-slate-50 dark:bg-slate-700/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                  <img src={editLogoPreview || "/imju-elota.webp"} alt="Logo" className="w-24 h-24 rounded-[1.5rem] object-contain bg-white border-2 border-slate-100 dark:border-slate-600 p-2 mb-4 shadow-sm" />
                  <label className="text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 font-black uppercase tracking-widest px-5 py-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm">
                      🔄 Cambiar Logotipo
                      <input type="file" accept="image/*" onChange={(e) => manejarSubidaArchivo(e, "logo")} className="hidden" />
                  </label>
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500 dark:text-slate-400 pl-2">Nombre Comercial</label>
                 <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/10 transition-all" required />
               </div>
               
               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500 dark:text-slate-400 pl-2">Giro (¿A qué te dedicas?)</label>
                 <input type="text" value={editGiro} onChange={(e) => setEditGiro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/10 transition-all" placeholder="Ej. Comida, Ropa, Barbería..." required />
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="col-span-2 md:col-span-1">
                   <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500 dark:text-slate-400 pl-2">Horario de Atención</label>
                   <input type="text" value={editHorario} onChange={(e) => setEditHorario(e.target.value)} placeholder="Ej. Lun-Sáb 9am a 6pm" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/10 transition-all" required />
                 </div>
                 <div className="col-span-2 md:col-span-1">
                   <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500 dark:text-slate-400 pl-2">WhatsApp de Contacto</label>
                   <input type="number" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} placeholder="10 dígitos" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/10 transition-all" required />
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500 dark:text-slate-400 pl-2">Ubicación en el Mapa</label>
                 <div className="w-full h-48 rounded-[1.5rem] overflow-hidden border-2 border-slate-200 dark:border-slate-600 relative z-0">
                    <MapContainer center={[editLat, editLng]} zoom={15} style={{ height: "100%", width: "100%" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[editLat, editLng]} draggable={true} eventHandlers={{ dragend: (e) => { const marker = e.target; const position = marker.getLatLng(); setEditLat(position.lat); setEditLng(position.lng); } }} />
                    </MapContainer>
                 </div>
                 <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-2 text-center font-bold">Mantén presionado el pin azul y arrástralo a tu ubicación exacta.</p>
               </div>
               
               <button type="submit" disabled={guardandoPerfil} className={`w-full mt-6 font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${guardandoPerfil ? "bg-slate-400 text-white" : "bg-[#D65F08] dark:bg-orange-700 hover:bg-slate-900 dark:hover:bg-orange-600 text-white shadow-[#D65F08]/20"}`}>
                 {guardandoPerfil ? "Guardando..." : "✅ Actualizar en Directorio"}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR PROMO O EMPLEO */}
      {creandoModal && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex flex-col justify-end md:items-center md:justify-center animate-fade-in p-0 md:p-6">
          <div className="bg-[#F3F5F9] dark:bg-slate-900 w-full max-w-md h-[95vh] md:max-h-[90vh] overflow-y-auto scroll-estetico rounded-t-[3rem] md:rounded-[3rem] p-8 pb-32 md:pb-8 shadow-2xl animate-slide-up relative border-t md:border border-slate-200 dark:border-slate-700">
             <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6 md:hidden"></div>
             <button onClick={limpiarFormulario} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center shadow-sm">✕</button>
             
             <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Crear {creandoModal === "promo" ? "Beneficio" : "Vacante"}</h3>
             
             <form onSubmit={creandoModal === "promo" ? publicarPromo : publicarEmpleo} className="space-y-5">
                {creandoModal === "promo" && (
                  <>
                    <select value={tipoPromo} onChange={(e) => setTipoPromo(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/10 transition-all shadow-sm" required>
                      <option value="">Selecciona el tipo...</option><option value="Directa">🏷️ Descuento Directo</option><option value="Frecuente">⭐ Lealtad (Visitas)</option><option value="Cumpleaños">🎂 Especial Cumpleañero</option>
                    </select>

                    <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-[2rem] border border-amber-100 dark:border-amber-800/50">
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-3 text-amber-800 dark:text-amber-400">¿Para qué Nivel de Tarjeta es?</label>
                      <select value={nivelRequerido} onChange={(e) => setNivelRequerido(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-transparent rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-amber-500/20 transition-all shadow-sm" required>
                        <option value="Clásica">🔹 Nivel Clásico (Todos)</option>
                        <option value="Oro">⭐ Nivel Oro (Clientes frecuentes)</option>
                        <option value="Black">👑 VIP Black (Solo élite)</option>
                      </select>
                    </div>
                  </>
                )}
                
                {tipoPromo === "Directa" && (
                  <label className="flex items-center gap-4 bg-orange-50 dark:bg-orange-900/20 p-5 rounded-[2rem] border border-orange-100 dark:border-orange-800/50 cursor-pointer">
                    <input type="checkbox" checked={usoUnico} onChange={(e) => setUsoUnico(e.target.checked)} className="w-6 h-6 accent-orange-600 rounded-md" />
                    <div>
                      <p className="text-sm font-black text-orange-800 dark:text-orange-400 leading-tight">Válido solo 1 vez por joven</p>
                      <p className="text-[10px] text-orange-600 dark:text-orange-500 font-bold mt-1">El cupón se bloqueará tras usarlo.</p>
                    </div>
                  </label>
                )}

                {tipoPromo === "Frecuente" && <input type="number" value={visitasRequeridas} onChange={(e) => setVisitasRequeridas(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/10 transition-all shadow-sm" placeholder="Meta de visitas (Ej. 5)" required />}
                
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/10 transition-all shadow-sm" placeholder="Título principal" required />
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/10 transition-all h-32 resize-none shadow-sm" placeholder="Descripción detallada..." required></textarea>
                <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/10 transition-all shadow-sm" placeholder="📍 Dirección o Sucursal donde aplica" required />
                
                {creandoModal === "empleo" && (
                  <div className="space-y-5">
                    <input type="text" value={sueldo} onChange={(e) => setSueldo(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none shadow-sm" placeholder="Sueldo (Ej. $1,500 Semanales)" required />
                    <div className="grid grid-cols-2 gap-3">
                       <select value={tipoEmpleo} onChange={(e) => setTipoEmpleo(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-xs font-bold text-slate-700 dark:text-white outline-none shadow-sm" required><option value="">Jornada...</option><option value="Medio Tiempo">Medio Tiempo</option><option value="Tiempo Completo">Tiempo Completo</option></select>
                       <input type="number" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-xs font-bold text-slate-700 dark:text-white outline-none shadow-sm" placeholder="WhatsApp (10 dig.)" required />
                    </div>
                  </div>
                )}

                {creandoModal === "promo" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5 text-slate-400 dark:text-slate-500 pl-2">Días que aplica</label>
                      <select value={diasValidos} onChange={(e) => setDiasValidos(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-xs font-bold text-slate-700 dark:text-white outline-none transition-all shadow-sm">
                        <option value="Todos los días">Todos los días</option><option value="Lunes a Viernes">Lun-Vie</option><option value="Fines de semana">Fines de semana</option><option value="Solo Lunes">Solo Lunes</option><option value="Solo Martes">Solo Martes</option><option value="Solo Miércoles">Solo Miércoles</option><option value="Solo Jueves">Solo Jueves</option><option value="Solo Viernes">Solo Viernes</option><option value="Solo Sábado">Solo Sábado</option><option value="Solo Domingo">Solo Domingo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5 text-slate-400 dark:text-slate-500 pl-2 text-center">Vencimiento</label>
                      <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-300 outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                )}

                {creandoModal === "promo" && (
                   <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-[2rem] p-5 text-center mt-2 shadow-sm">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Foto del Cupón (Opcional)</p>
                     {!imgPromoPreview ? (
                        <label className="bg-orange-50 dark:bg-orange-900/20 text-[#D65F08] dark:text-orange-400 border border-orange-200 dark:border-orange-800 font-bold py-3 px-6 rounded-xl cursor-pointer text-[10px] uppercase tracking-widest hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors inline-block">
                           📁 Subir Foto <input type="file" accept="image/*" onChange={(e) => manejarSubidaArchivo(e, "promo")} className="hidden" />
                        </label>
                     ) : (
                        <div className="flex flex-col items-center">
                           <img src={imgPromoPreview} alt="Promo" className="h-32 object-contain rounded-[1.5rem] border border-slate-200 dark:border-slate-600 mb-3 bg-slate-50 dark:bg-slate-700 p-1 shadow-sm" />
                           <button type="button" onClick={() => {setImgPromoFile(null); setImgPromoPreview(null);}} className="text-[10px] text-red-500 dark:text-red-400 font-black uppercase tracking-widest underline">Quitar foto</button>
                        </div>
                     )}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-2">
                  <button type="submit" disabled={publicandoPromo} className={`w-full text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${publicandoPromo ? "bg-slate-400 dark:bg-slate-600" : "bg-[#D65F08] hover:bg-slate-900 dark:bg-orange-700 dark:hover:bg-orange-600 shadow-[#D65F08]/20"}`}>
                     {publicandoPromo ? "Publicando..." : "✅ Publicar en la App"}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR FLOTANTE */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[360px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl shadow-slate-300/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] px-2 py-3 z-40">
        <div className="flex justify-between items-center">
          {[
            { id: "escaner", icon: "📷", label: "TPV" },
            { id: "promos", icon: "🎟️", label: "Cupones" },
            { id: "menu", icon: "📖", label: "Menú" }, 
            { id: "empleos", icon: "💼", label: "Empleos" },
            { id: "estadisticas", icon: "📊", label: "Métricas" }
          ].map((btn) => {
            const activo = pestañaActiva === btn.id;
            return (
              <button 
                key={btn.id}
                onClick={() => setPestañaActiva(btn.id)} 
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 py-2 rounded-2xl ${activo ? "text-[#D65F08] dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}
              >
                <span className={`text-2xl transition-transform ${activo ? "scale-110" : "scale-100"}`}>{btn.icon}</span>
                <span className={`text-[8px] font-black uppercase tracking-tighter w-full text-center transition-all ${activo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 h-0"}`}>{btn.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </main>
  );
}