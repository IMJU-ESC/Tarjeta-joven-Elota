"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, type CameraHandle } from "@/components/NativeCamera";
import { collection, addDoc, query, where, getDocs, getDoc, deleteDoc, deleteField, doc, updateDoc, setDoc } from "firebase/firestore"; 
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth, storage } from "../../firebase";
import { generarCodigoQrJoven, generarContrasenaJoven, generarContrasenaNegocio, normalizarCorreo } from "@/lib/credenciales";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

export default function PanelAdministrativo() {
  const router = useRouter();
  
  const [correoAdminInput, setCorreoAdminInput] = useState("");
  const [passAdminInput, setPassAdminInput] = useState("");
  const [adminActual, setAdminActual] = useState<any>(null);
  
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [verificandoLogin, setVerificandoLogin] = useState(false);

  const [pestaña, setPestaña] = useState("pendientes"); 
  const [modalJoven, setModalJoven] = useState(false);
  const [modalNegocio, setModalNegocio] = useState(false);
  
  const [listaJovenes, setListaJovenes] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  
  const [listaNegocios, setListaNegocios] = useState<any[]>([]);
  const [solicitudesNegocios, setSolicitudesNegocios] = useState<any[]>([]);
  const [subPestañaPendientes, setSubPestañaPendientes] = useState("jovenes"); 

  const [visitas, setVisitas] = useState<any[]>([]); 
  const [anuncios, setAnuncios] = useState<any[]>([]); 
  const [listaAdmins, setListaAdmins] = useState<any[]>([]);
  
  const [listaPromos, setListaPromos] = useState<any[]>([]);
  const [listaEmpleos, setListaEmpleos] = useState<any[]>([]);
  
  const [modalAdmin, setModalAdmin] = useState(false);
  const [nuevoCorreoAdmin, setNuevoCorreoAdmin] = useState("");
  const [nuevoPassAdmin, setNuevoPassAdmin] = useState("");
  const [nuevoRolAdmin, setNuevoRolAdmin] = useState("Staff");

  const [cargando, setCargando] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().substring(0, 7));
  const [busqueda, setBusqueda] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState("");
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState(""); 
  const [localidad, setLocalidad] = useState("");
  const [correo, setCorreo] = useState("");
  const [genero, setGenero] = useState("");
  const [ocupacion, setOcupacion] = useState("");
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);

  const centroElota = { lat: 23.92173, lng: -106.89264 };
  
  const [modoEdicionNegocio, setModoEdicionNegocio] = useState(false);
  const [idEditandoNegocio, setIdEditandoNegocio] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [giroNegocio, setGiroNegocio] = useState("");
  const [correoNegocio, setCorreoNegocio] = useState("");
  const [passwordNegocio, setPasswordNegocio] = useState("");
  const [horarioNegocio, setHorarioNegocio] = useState("");
  const [telefonoNegocio, setTelefonoNegocio] = useState("");
  
  const [logoNegocioBase64, setLogoNegocioBase64] = useState<string | null>(null);
  const [latNegocio, setLatNegocio] = useState(centroElota.lat);
  const [lngNegocio, setLngNegocio] = useState(centroElota.lng);

  const [tituloAviso, setTituloAviso] = useState("");
  const [mensajeAviso, setMensajeAviso] = useState("");
  const [audienciaAviso, setAudienciaAviso] = useState("Todos");

  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [camaraFrontal, setCamaraFrontal] = useState(false); 
  const cameraRef = useRef<CameraHandle>(null);

  const [imagenCompleta, setImagenCompleta] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdminActual(null);
        setVerificandoSesion(false);
        return;
      }

      try {
        // El documento del administrador debe llamarse igual que su UID de Authentication.
        const adminRef = doc(db, "administradores", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          await signOut(auth);
          setAdminActual(null);
          return;
        }

        const dataAdmin = adminSnap.data();

        if (dataAdmin.rol !== "Master" && dataAdmin.rol !== "Staff") {
          await signOut(auth);
          setAdminActual(null);
          return;
        }

        const usuarioValidado: any = {
          idFirebase: adminSnap.id,
          uid: user.uid,
          ...dataAdmin,
        };

        setAdminActual(usuarioValidado);
        await cargarDirectorio(dataAdmin.rol);
      } catch (error) {
        console.error("Error validando sesión automática:", error);
        setAdminActual(null);
      } finally {
        setVerificandoSesion(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const verificarCredenciales = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificandoLogin(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        correoAdminInput.trim().toLowerCase(),
        passAdminInput
      );

      const user = userCredential.user;
      const adminRef = doc(db, "administradores", user.uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        await signOut(auth);
        alert("Tu correo y contraseña son correctos, pero no existe un documento de administrador con tu UID.");
        return;
      }

      const dataAdmin = adminSnap.data();

      if (dataAdmin.rol !== "Master" && dataAdmin.rol !== "Staff") {
        await signOut(auth);
        alert("El usuario existe, pero su rol debe ser exactamente Master o Staff.");
        return;
      }

      const usuarioValidado: any = {
        idFirebase: adminSnap.id,
        uid: user.uid,
        ...dataAdmin,
      };

      setAdminActual(usuarioValidado);
      await cargarDirectorio(dataAdmin.rol);
    } catch (error: any) {
      console.error("Error real al iniciar sesión:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        alert("El correo o la contraseña no son correctos.");
      } else if (
        error.code === "permission-denied" ||
        error.code === "firestore/permission-denied"
      ) {
        alert("El correo y contraseña fueron aceptados, pero las reglas de Firestore bloquearon el acceso.");
      } else {
        alert(`Error al iniciar sesión: ${error.code || error.message}`);
      }
    } finally {
      setVerificandoLogin(false);
    }
  };

  const cargarDirectorio = async (rolUsuario: string) => {
    setCargando(true);
    try {
      const queryJovenes = await getDocs(collection(db, "jovenes"));
      const tempJovenes: any[] = [];
      const tempSolicitudes: any[] = [];
      queryJovenes.forEach((doc) => {
         const data = doc.data();
         if (data.estatus === "Pendiente") { tempSolicitudes.push({ idFirebase: doc.id, ...data }); } 
         else { tempJovenes.push({ idFirebase: doc.id, ...data }); }
      });
      tempJovenes.sort((a, b) => (a.nombreCompleto || "").localeCompare(b.nombreCompleto || ""));
      tempSolicitudes.sort((a, b) => (a.nombreCompleto || "").localeCompare(b.nombreCompleto || ""));
      setListaJovenes(tempJovenes); setSolicitudes(tempSolicitudes);

      const queryNegocios = await getDocs(collection(db, "negocios"));
      const tempNegocios: any[] = [];
      const tempSolNegocios: any[] = [];
      queryNegocios.forEach((doc) => {
         const data = doc.data();
         if(data.estatus === "Pendiente") { tempSolNegocios.push({ idFirebase: doc.id, ...data }); }
         else { tempNegocios.push({ idFirebase: doc.id, ...data }); }
      });
      setListaNegocios(tempNegocios);
      setSolicitudesNegocios(tempSolNegocios);

      const queryVisitas = await getDocs(collection(db, "visitas"));
      const tempV: any[] = [];
      queryVisitas.forEach(doc => tempV.push({ idFirebase: doc.id, ...doc.data() }));
      tempV.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setVisitas(tempV);

      const queryAnuncios = await getDocs(collection(db, "anuncios"));
      const tempA: any[] = [];
      queryAnuncios.forEach(doc => tempA.push({ idFirebase: doc.id, ...doc.data() }));
      tempA.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setAnuncios(tempA);

      const queryPromos = await getDocs(collection(db, "promociones"));
      const tempPromos: any[] = [];
      queryPromos.forEach(doc => tempPromos.push({ idFirebase: doc.id, ...doc.data() }));
      setListaPromos(tempPromos);

      const queryEmpleos = await getDocs(collection(db, "empleos"));
      const tempEmpleos: any[] = [];
      queryEmpleos.forEach(doc => tempEmpleos.push({ idFirebase: doc.id, ...doc.data() }));
      setListaEmpleos(tempEmpleos);

      if (rolUsuario === "Master") {
        const queryAdmins = await getDocs(collection(db, "administradores"));
        const tempAdmins: any[] = [];
        queryAdmins.forEach(doc => tempAdmins.push({ idFirebase: doc.id, ...doc.data() }));
        setListaAdmins(tempAdmins);
      }
    } catch(e) { console.error(e); }
    setCargando(false);
  };

  const calcularEdad = (fechaNac: string) => {
    if (!fechaNac) return 0;
    const hoy = new Date(); const cumple = new Date(fechaNac);
    let edadCalculada = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edadCalculada--;
    return edadCalculada;
  };

  const enviarCorreoSistema = async (datos: Record<string, string>) => {
    const respuesta = await fetch('/api/enviar-correo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(resultado?.error || "No fue posible enviar el correo.");
    }
  };

  const eliminarArchivoStorage = async (rutaOUrl?: string) => {
    if (!rutaOUrl) return;

    try {
      await deleteObject(ref(storage, rutaOUrl));
    } catch (error: any) {
      if (error?.code !== "storage/object-not-found") throw error;
    }
  };

  const aprobarSolicitud = async (joven: any) => {
    if(!window.confirm(`¿Aprobar y generar acceso para ${joven.nombreCompleto}?`)) return;
    setCargando(true);
    try {
      const nuevaPassword = generarContrasenaJoven();
      const nuevoCodigoQr = generarCodigoQrJoven();
      
      await updateDoc(doc(db, "jovenes", joven.idFirebase), {
         estatus: "Activo",
         contrasena: nuevaPassword,
         codigoUnicoQR: nuevoCodigoQr,
         fechaAprobacion: new Date().toISOString(),
      });

      let documentoEliminado = true;
      try {
        await eliminarArchivoStorage(joven.documentoProbatorioPath || joven.documentoProbatorio);
        await updateDoc(doc(db, "jovenes", joven.idFirebase), {
          documentoProbatorio: deleteField(),
          documentoProbatorioPath: deleteField(),
        });
      } catch (error) {
        documentoEliminado = false;
        console.error("No fue posible borrar el documento probatorio:", error);
      }

      let correoEnviado = true;
      try {
        await enviarCorreoSistema({
          tipo: 'aprobacion',
          correo: joven.correo,
          nombre: joven.nombreCompleto,
          password: nuevaPassword,
        });
      } catch(error) {
        correoEnviado = false;
        console.error("Error enviando acceso al joven:", error);
      }

      const avisos = ["¡Joven aprobado! Su contraseña y QR único ya fueron generados."];
      avisos.push(correoEnviado
        ? "La contraseña fue enviada por correo."
        : `No se pudo enviar el correo. Entrega manualmente esta contraseña: ${nuevaPassword}`);
      if (!documentoEliminado) avisos.push("Aviso: no se pudo eliminar el documento probatorio de Storage.");
      alert(avisos.join("\n\n"));
      await cargarDirectorio(adminActual.rol);
    } catch(error: any) {
      console.error("Error aprobando joven:", error);
      alert(`Error al aprobar: ${error?.code || error?.message || "error desconocido"}`);
    }
    setCargando(false);
  }

  const rechazarSolicitud = async (joven: any) => {
     const motivo = window.prompt(`Ingresa el motivo del rechazo para ${joven.nombreCompleto}\n(Ej: Foto ilegible, edad fuera de rango):`);
     if(!motivo) return;
     
     setCargando(true);
     try {
       await eliminarArchivoStorage(joven.documentoProbatorioPath || joven.documentoProbatorio);
       await eliminarArchivoStorage(joven.fotoPerfilPath || joven.fotoPerfil);
       await deleteDoc(doc(db, "jovenes", joven.idFirebase));

       let correoEnviado = true;
       try {
         await enviarCorreoSistema({
           tipo: 'rechazo',
           correo: joven.correo,
           nombre: joven.nombreCompleto,
           motivo,
         });
       } catch(error) {
         correoEnviado = false;
         console.error("Error enviando rechazo al joven:", error);
       }

       alert(correoEnviado
         ? "Solicitud rechazada. El registro y sus archivos fueron eliminados."
         : "Solicitud rechazada y archivos eliminados, pero el correo no pudo enviarse.");
       await cargarDirectorio(adminActual.rol);
     } catch(error: any) {
       console.error("Error rechazando joven:", error);
       alert(`No se completó el rechazo: ${error?.code || error?.message || "error desconocido"}`);
     }
     setCargando(false);
  }

  const aprobarNegocioAdmin = async (negocio: any) => {
    if(!window.confirm(`¿Aprobar al negocio ${negocio.nombreComercial}?`)) return;
    setCargando(true);
    try {
      const nuevaPassword = generarContrasenaNegocio();
      await updateDoc(doc(db, "negocios", negocio.idFirebase), {
        estatus: "Activo",
        contrasena: nuevaPassword,
        fechaAprobacion: new Date().toISOString(),
      });
      
      // ✅ CENTINELA: Actualizar caché para que el negocio aparezca en la tarjeta
      await setDoc(doc(db, "sistema", "estado"), { ultimaActualizacion: Date.now() }, { merge: true });

      let evidenciaEliminada = true;
      try {
        await eliminarArchivoStorage(negocio.evidenciaFachadaPath || negocio.evidenciaFachada);
        await updateDoc(doc(db, "negocios", negocio.idFirebase), {
          evidenciaFachada: deleteField(),
          evidenciaFachadaPath: deleteField(),
        });
      } catch(error) {
        evidenciaEliminada = false;
        console.error("No fue posible borrar la evidencia del negocio:", error);
      }

      let correoEnviado = true;
      try {
        await enviarCorreoSistema({
          tipo: 'aprobacion_negocio',
          correo: negocio.correo,
          nombre: negocio.nombreComercial,
          password: nuevaPassword,
        });
      } catch(error) {
        correoEnviado = false;
        console.error("Error enviando acceso al negocio:", error);
      }

      const avisos = ["¡Negocio aprobado y contraseña generada!"];
      avisos.push(correoEnviado
        ? "La contraseña fue enviada por correo."
        : `No se pudo enviar el correo. Entrega manualmente esta contraseña: ${nuevaPassword}`);
      if (!evidenciaEliminada) avisos.push("Aviso: no se pudo eliminar la evidencia de fachada de Storage.");
      alert(avisos.join("\n\n"));
      await cargarDirectorio(adminActual.rol);
    } catch(error: any) {
      console.error("Error aprobando negocio:", error);
      alert(`Error al aprobar: ${error?.code || error?.message || "error desconocido"}`);
    }
    setCargando(false);
  }

  const rechazarNegocioAdmin = async (negocio: any) => {
     const motivo = window.prompt(`Ingresa el motivo del rechazo para ${negocio.nombreComercial}:`);
     if(!motivo) return;
     setCargando(true);
     try {
       await eliminarArchivoStorage(negocio.evidenciaFachadaPath || negocio.evidenciaFachada);
       await eliminarArchivoStorage(negocio.logoPath || negocio.logo);
       await deleteDoc(doc(db, "negocios", negocio.idFirebase));
       await setDoc(doc(db, "sistema", "estado"), { ultimaActualizacion: Date.now() }, { merge: true });

       let correoEnviado = true;
       try {
         await enviarCorreoSistema({
           tipo: 'rechazo_negocio',
           correo: negocio.correo,
           nombre: negocio.nombreComercial,
           motivo,
         });
       } catch(error) {
         correoEnviado = false;
         console.error("Error enviando rechazo al negocio:", error);
       }

       alert(correoEnviado
         ? "Solicitud rechazada. El registro y sus archivos fueron eliminados."
         : "Solicitud rechazada y archivos eliminados, pero el correo no pudo enviarse.");
       await cargarDirectorio(adminActual.rol);
     } catch(error: any) {
       console.error("Error rechazando negocio:", error);
       alert(`No se completó el rechazo: ${error?.code || error?.message || "error desconocido"}`);
     }
     setCargando(false);
  }

  const procesarImagen = (fuenteImagen: string, esLogo: boolean = false) => {
    const img = new Image(); img.src = fuenteImagen;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = esLogo ? 400 : 300; const MAX_HEIGHT = esLogo ? 400 : 300;
      let width = img.width; let height = img.height;
      if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
      else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0, width, height);
      const resultado = canvas.toDataURL("image/jpeg", 0.8);
      if (esLogo) { setLogoNegocioBase64(resultado); } else { setFotoBase64(resultado); setMostrarCamara(false); }
    };
  };

  const manejarSubidaArchivo = (e: React.ChangeEvent<HTMLInputElement>, esLogo: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (evento) => { if (evento.target?.result) procesarImagen(evento.target.result as string, esLogo); }; reader.readAsDataURL(file); }
  };

  const guardarJoven = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !fechaNacimiento || !localidad || !correo || !genero || !ocupacion) { alert("Llena todos los campos."); return; }
    if (!fotoBase64) { alert("Falta la foto de perfil del joven."); return; }

    const edadJoven = calcularEdad(fechaNacimiento);
    if (edadJoven < 12 || edadJoven > 29) { alert(`⚠️ BLOQUEO DE SISTEMA:\nEl joven tiene ${edadJoven} años.\nPor reglamento del IMJU, el programa es exclusivo para personas de 12 a 29 años.`); return; }

    setCargando(true);
    try {
      const correoNormalizado = normalizarCorreo(correo);
      const q = query(collection(db, "jovenes"), where("correo", "==", correoNormalizado));
      const validacion = await getDocs(q);
      
      if (modoEdicion) {
        if (validacion.docs.some(doc => doc.id !== idEditando)) { alert("¡Ese correo ya pertenece a otro joven!"); setCargando(false); return; }

        let nuevaUrlFoto = fotoBase64;
        let nuevaRutaFoto: string | undefined;
        if (fotoBase64 && fotoBase64.startsWith("data:image")) {
           const fotoRef = ref(storage, `jovenes_perfiles/${globalThis.crypto.randomUUID()}_perfil_edit.jpg`);
           await uploadString(fotoRef, fotoBase64, 'data_url');
           nuevaUrlFoto = await getDownloadURL(fotoRef);
           nuevaRutaFoto = fotoRef.fullPath;
        }

        await updateDoc(doc(db, "jovenes", idEditando), {
          nombreCompleto: nombre.trim(), fechaNacimiento: fechaNacimiento, localidad: localidad.trim(),
          correo: correoNormalizado, genero: genero, ocupacion: ocupacion, fotoPerfil: nuevaUrlFoto,
          ...(nuevaRutaFoto ? { fotoPerfilPath: nuevaRutaFoto } : {}),
        });
        alert("¡Datos del joven actualizados!");
      } else {
        if (!validacion.empty) { alert("¡Este correo ya está registrado en el sistema!"); setCargando(false); return; }

        const nuevaPassword = generarContrasenaJoven();
        const nuevoCodigoQr = generarCodigoQrJoven();
        let nuevaUrlFoto = fotoBase64;
        let nuevaRutaFoto = "";
        if (fotoBase64 && fotoBase64.startsWith("data:image")) {
           const fotoRef = ref(storage, `jovenes_perfiles/${globalThis.crypto.randomUUID()}_perfil_alta.jpg`);
           await uploadString(fotoRef, fotoBase64, 'data_url');
           nuevaUrlFoto = await getDownloadURL(fotoRef);
           nuevaRutaFoto = fotoRef.fullPath;
        }

        await addDoc(collection(db, "jovenes"), {
          nombreCompleto: nombre.trim(), fechaNacimiento: fechaNacimiento, localidad: localidad.trim(),
          correo: correoNormalizado, genero: genero, ocupacion: ocupacion,
          fotoPerfil: nuevaUrlFoto, fotoPerfilPath: nuevaRutaFoto,
          estatus: "Activo", contrasena: nuevaPassword, codigoUnicoQR: nuevoCodigoQr,
          fechaRegistro: new Date().toISOString(), fechaAprobacion: new Date().toISOString(),
        });

        let correoEnviado = true;
        try {
          await enviarCorreoSistema({
            tipo: 'aprobacion',
            correo: correoNormalizado,
            nombre: nombre.trim(),
            password: nuevaPassword,
          });
        } catch(error) {
          correoEnviado = false;
          console.error("Error enviando acceso del alta presencial:", error);
        }

        alert(correoEnviado
          ? `¡Joven ${nombre.trim()} registrado! La contraseña fue enviada por correo y su QR único ya está activo.`
          : `¡Joven registrado y QR generado! No se pudo enviar el correo. Entrega esta contraseña: ${nuevaPassword}`);
      }

      cancelarEdicionJoven(); 
      cargarDirectorio(adminActual.rol);
    } catch (error: any) {
      console.error("Error guardando joven:", error);
      alert(`Error al guardar al joven: ${error?.code || error?.message || "error desconocido"}`);
    }
    setCargando(false);
  };

  const eliminarJoven = async (id: string, nom: string) => {
    if (window.confirm(`¿Eliminar a ${nom}?`)) { await deleteDoc(doc(db, "jovenes", id)); cargarDirectorio(adminActual.rol); }
  };

  const iniciarAltaJoven = () => {
    setNombre(""); setFechaNacimiento(""); setLocalidad(""); setCorreo(""); setGenero(""); setOcupacion(""); 
    setFotoBase64(null); setIdEditando(""); setModoEdicion(false); setModalJoven(true);
  };

  const iniciarEdicionJoven = (j: any) => {
    setNombre(j.nombreCompleto); setFechaNacimiento(j.fechaNacimiento || ""); setLocalidad(j.localidad);
    setCorreo(j.correo); setGenero(j.genero || ""); setOcupacion(j.ocupacion || "");
    setFotoBase64(j.fotoPerfil); setIdEditando(j.idFirebase); setModoEdicion(true); setModalJoven(true);
  };

  const cancelarEdicionJoven = () => {
    setNombre(""); setFechaNacimiento(""); setLocalidad(""); setCorreo(""); setGenero(""); setOcupacion(""); 
    setFotoBase64(null); setIdEditando(""); setModoEdicion(false); setModalJoven(false); setMostrarCamara(false);
  };

  const registrarNegocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNegocio || !giroNegocio || !correoNegocio || !horarioNegocio || !telefonoNegocio) { alert("Llena todos los campos del negocio."); return; }
    if (!logoNegocioBase64) { alert("Falta subir el logo."); return; }
    setCargando(true);
    try {
      const correoNormalizado = normalizarCorreo(correoNegocio);
      const q = query(collection(db, "negocios"), where("correo", "==", correoNormalizado));
      if (!(await getDocs(q)).empty) { alert("¡Correo en uso por otro negocio!"); setCargando(false); return; }

      const nuevaPassword = generarContrasenaNegocio();
      let nuevaUrlLogo = logoNegocioBase64;
      let nuevaRutaLogo = "";
      if (logoNegocioBase64 && logoNegocioBase64.startsWith("data:image")) {
         const logoRef = ref(storage, `negocios_logos/${globalThis.crypto.randomUUID()}_logo.jpg`);
         await uploadString(logoRef, logoNegocioBase64, 'data_url');
         nuevaUrlLogo = await getDownloadURL(logoRef);
         nuevaRutaLogo = logoRef.fullPath;
      }

      await addDoc(collection(db, "negocios"), {
        nombreComercial: nombreNegocio.trim(), giro: giroNegocio.trim(), correo: correoNormalizado,
        contrasena: nuevaPassword, logo: nuevaUrlLogo, logoPath: nuevaRutaLogo,
        estatus: "Activo", fechaRegistro: new Date().toISOString(), fechaAprobacion: new Date().toISOString(),
        lat: latNegocio, lng: lngNegocio, horario: horarioNegocio.trim(), telefono: telefonoNegocio.trim()
      });
      
      // ✅ CENTINELA: Actualizar caché
      await setDoc(doc(db, "sistema", "estado"), { ultimaActualizacion: Date.now() }, { merge: true });

      let correoEnviado = true;
      try {
        await enviarCorreoSistema({
          tipo: 'aprobacion_negocio',
          correo: correoNormalizado,
          nombre: nombreNegocio.trim(),
          password: nuevaPassword,
        });
      } catch(error) {
        correoEnviado = false;
        console.error("Error enviando acceso del negocio:", error);
      }

      alert(correoEnviado
        ? `¡Negocio "${nombreNegocio}" registrado! La contraseña fue enviada por correo.`
        : `¡Negocio registrado! No se pudo enviar el correo. Entrega esta contraseña: ${nuevaPassword}`);
      cancelarEdicionNegocio(); cargarDirectorio(adminActual.rol);
    } catch (error: any) {
      console.error("Error registrando negocio desde el panel:", error);
      alert(`Error al registrar el negocio: ${error?.code || error?.message || "error desconocido"}`);
    }
    setCargando(false);
  };

  const actualizarNegocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNegocio || !giroNegocio || !correoNegocio || !passwordNegocio || !horarioNegocio || !telefonoNegocio) { alert("Llena todos los campos."); return; }
    setCargando(true);
    try {
      const correoNormalizado = normalizarCorreo(correoNegocio);
      const q = query(collection(db, "negocios"), where("correo", "==", correoNormalizado));
      const validacion = await getDocs(q);
      if (validacion.docs.some(doc => doc.id !== idEditandoNegocio)) { alert("¡Ese correo ya pertenece a otro negocio!"); setCargando(false); return; }

      let nuevaUrlLogo = logoNegocioBase64;
      if (logoNegocioBase64 && logoNegocioBase64.startsWith("data:image")) {
         const logoRef = ref(storage, `negocios_logos/${Date.now()}_logo.jpg`);
         await uploadString(logoRef, logoNegocioBase64, 'data_url');
         nuevaUrlLogo = await getDownloadURL(logoRef);
      }

      await updateDoc(doc(db, "negocios", idEditandoNegocio), {
        nombreComercial: nombreNegocio.trim(), giro: giroNegocio.trim(), correo: correoNormalizado,
        contrasena: passwordNegocio, logo: nuevaUrlLogo, lat: latNegocio, lng: lngNegocio,
        horario: horarioNegocio.trim(), telefono: telefonoNegocio.trim()
      });

      // ✅ CENTINELA: Actualizar caché
      await setDoc(doc(db, "sistema", "estado"), { ultimaActualizacion: Date.now() }, { merge: true });

      alert("¡Datos del negocio y ubicación actualizados!");
      cancelarEdicionNegocio(); cargarDirectorio(adminActual.rol);
    } catch (error) { alert("Error al actualizar."); }
    setCargando(false);
  };

  const eliminarNegocio = async (id: string, nom: string) => {
    if (window.confirm(`¿Eliminar definitivamente el negocio ${nom}?`)) { 
      await deleteDoc(doc(db, "negocios", id)); 
      
      // ✅ CENTINELA: Actualizar caché
      await setDoc(doc(db, "sistema", "estado"), { ultimaActualizacion: Date.now() }, { merge: true });

      cargarDirectorio(adminActual.rol); 
    }
  };

  const eliminarPublicacion = async (coleccion: string, id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar esta publicación del directorio público? Esta acción no se puede deshacer.")) {
       setCargando(true);
       try {
         await deleteDoc(doc(db, coleccion, id));
         
         // ✅ CENTINELA: Actualizar caché
         await setDoc(doc(db, "sistema", "estado"), { ultimaActualizacion: Date.now() }, { merge: true });

         alert("Publicación eliminada correctamente.");
         cargarDirectorio(adminActual.rol);
       } catch (error) {
         alert("Error al eliminar la publicación.");
       }
       setCargando(false);
    }
  }

  const iniciarEdicionNegocio = (n: any) => {
    setNombreNegocio(n.nombreComercial); setGiroNegocio(n.giro); setCorreoNegocio(n.correo);
    setPasswordNegocio(n.contrasena); setLogoNegocioBase64(n.logo); setIdEditandoNegocio(n.idFirebase);
    setLatNegocio(n.lat || centroElota.lat); setLngNegocio(n.lng || centroElota.lng);
    setHorarioNegocio(n.horario || ""); setTelefonoNegocio(n.telefono || "");
    setModoEdicionNegocio(true); setModalNegocio(true);
  };

  const cancelarEdicionNegocio = () => {
    setNombreNegocio(""); setGiroNegocio(""); setCorreoNegocio(""); setPasswordNegocio(""); 
    setLogoNegocioBase64(null); setIdEditandoNegocio(""); setLatNegocio(centroElota.lat); setLngNegocio(centroElota.lng);
    setHorarioNegocio(""); setTelefonoNegocio("");
    setModoEdicionNegocio(false); setModalNegocio(false);
  };

  const publicarAnuncio = async (e: React.FormEvent) => {
    e.preventDefault(); if(!tituloAviso || !mensajeAviso) return;
    setCargando(true);
    try {
      await addDoc(collection(db, "anuncios"), { titulo: tituloAviso.trim(), mensaje: mensajeAviso.trim(), audiencia: audienciaAviso, fecha: new Date().toISOString() });
      alert("¡Aviso publicado globalmente!"); setTituloAviso(""); setMensajeAviso(""); setAudienciaAviso("Todos"); cargarDirectorio(adminActual.rol);
    } catch(e) { alert("Error al publicar aviso."); }
    setCargando(false);
  };

  const eliminarAnuncio = async (id: string) => { if(window.confirm("¿Retirar este aviso del sistema?")) { await deleteDoc(doc(db, "anuncios", id)); cargarDirectorio(adminActual.rol); } };

  const crearAdministrador = async (e: React.FormEvent) => {
    e.preventDefault(); if (adminActual?.rol !== "Master") return;
    setCargando(true);
    try {
      const q = query(collection(db, "administradores"), where("correo", "==", nuevoCorreoAdmin.trim()));
      if (!(await getDocs(q)).empty) { alert("Ese correo ya tiene una cuenta."); setCargando(false); return; }
      await addDoc(collection(db, "administradores"), {
        correo: nuevoCorreoAdmin.trim(), password: nuevoPassAdmin, rol: nuevoRolAdmin, fechaCreacion: new Date().toISOString()
      });
      alert("✅ Usuario creado exitosamente. Recuerda también crearle cuenta en Firebase Authentication.");
      setNuevoCorreoAdmin(""); setNuevoPassAdmin(""); setNuevoRolAdmin("Staff"); setModalAdmin(false);
      cargarDirectorio(adminActual.rol);
    } catch (e) { alert("Error al crear usuario."); }
    setCargando(false);
  };

  const eliminarAdministrador = async (id: string, correoUser: string) => {
    if (adminActual?.rol !== "Master") return;
    if (adminActual.idFirebase === id) { alert("No puedes borrar tu propia cuenta."); return; }
    if (window.confirm(`¿Revocar acceso al usuario ${correoUser}?`)) {
      await deleteDoc(doc(db, "administradores", id)); cargarDirectorio(adminActual.rol);
    }
  };

  const descargarExcel = (tipo: string) => {
    let csvContent = "\uFEFF"; let nombreArchivo = ""; const limpiar = (texto: string) => `"${(texto || "").toString().replace(/"/g, '""')}"`;
    if (tipo === "jovenes") {
      nombreArchivo = "Directorio_Jovenes.csv"; csvContent += "Nombre,Fecha Nacimiento,Edad,Género,Ocupación,Localidad,Correo,Código QR\n";
      jovenesFiltrados.forEach(j => { 
        const edadActual = j.fechaNacimiento ? calcularEdad(j.fechaNacimiento) : (j.edad || "N/A");
        const generoExcel = j.genero || "No especificado";
        csvContent += `${limpiar(j.nombreCompleto)},${limpiar(j.fechaNacimiento || 'N/A')},${limpiar(edadActual.toString())},${limpiar(generoExcel)},${limpiar(j.ocupacion)},${limpiar(j.localidad)},${limpiar(j.correo)},${limpiar(j.codigoUnicoQR)}\n`; 
      });
    } else if (tipo === "negocios") {
      nombreArchivo = "Directorio_Negocios.csv"; csvContent += "Comercio,Giro,Correo,Contraseña\n";
      negociosFiltrados.forEach(n => { csvContent += `${limpiar(n.nombreComercial)},${limpiar(n.giro)},${limpiar(n.correo)},${limpiar(n.contrasena)}\n`; });
    } else if (tipo === "visitas") {
      nombreArchivo = `Reporte_Visitas_${mesSeleccionado}.csv`; csvContent += "Fecha,Joven,Género,Negocio,Promoción\n";
      visitasFiltradas.forEach(v => { 
         const f = new Date(v.fecha).toLocaleString("es-MX"); 
         const gen = v.generoJoven || "No especificado";
         csvContent += `${limpiar(f)},${limpiar(v.nombreJoven)},${limpiar(gen)},${limpiar(v.nombreNegocio)},${limpiar(v.nombrePromo)}\n`; 
      });
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.setAttribute("download", nombreArchivo); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const cambiarPestaña = (nuevaPestaña: string) => { setPestaña(nuevaPestaña); setBusqueda(""); };

  const jovenesFiltrados = listaJovenes.filter(j => 
    j.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    j.codigoUnicoQR?.toLowerCase().includes(busqueda.toLowerCase()) ||
    j.correo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const negociosFiltrados = listaNegocios.filter(n => 
    n.nombreComercial?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.correo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const visitasFiltradas = visitas.filter(v => v.fecha && v.fecha.startsWith(mesSeleccionado));

  if (verificandoSesion) {
     return (
       <main className="min-h-screen bg-[#F3F5F9] flex items-center justify-center">
         <div className="flex flex-col items-center">
           <div className="w-14 h-14 border-4 border-[#D65F08]/20 border-t-[#D65F08] rounded-full animate-spin mb-4"></div>
           <p className="text-xs font-black uppercase tracking-widest text-[#D65F08]">Verificando Credenciales...</p>
         </div>
       </main>
     );
  }

  if (!adminActual) {
    return (
      <main className="min-h-screen bg-[#F3F5F9] flex items-center justify-center px-4 md:px-6 selection:bg-[#D65F08] selection:text-white">
        <div className="bg-white p-10 md:p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-slate-100 relative animate-fade-in">
          <div className="w-24 h-24 bg-[#D65F08] rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-orange-900/20">
            <img src="/imju-elota.webp" alt="IMJU" className="w-14 h-14 object-contain filter brightness-0 invert" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Panel Central</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-10">Administración IMJU</p>
          
          <form onSubmit={verificarCredenciales}>
            <input type="email" value={correoAdminInput} onChange={(e) => setCorreoAdminInput(e.target.value)} placeholder="Correo Institucional" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#D65F08] focus:bg-white transition-all mb-4" required />
            <input type="password" value={passAdminInput} onChange={(e) => setPassAdminInput(e.target.value)} placeholder="Contraseña" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#D65F08] focus:bg-white transition-all mb-8" required />
            <button disabled={verificandoLogin} className={`w-full font-black py-4.5 rounded-2xl uppercase tracking-widest transition-all shadow-xl ${verificandoLogin ? "bg-slate-400 text-white" : "bg-[#D65F08] text-white hover:bg-slate-900 hover:shadow-2xl active:scale-[0.98]"}`}>
              {verificandoLogin ? "Autenticando..." : "Ingresar al Sistema"}
            </button>
          </form>
          
          <div className="mt-10 pt-6 border-t border-slate-100">
             <Link href="/aviso-de-privacidad" target="_blank" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#D65F08] transition-colors">Ver Aviso de Privacidad Oficial</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F5F9] font-sans pb-20 selection:bg-[#D65F08] selection:text-white relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-up { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (pointer: fine) { 
          .scroll-estetico::-webkit-scrollbar { width: 8px; height: 8px; }
          .scroll-estetico::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); border-radius: 10px; }
          .scroll-estetico::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.4); border-radius: 10px; }
          .scroll-estetico:hover::-webkit-scrollbar-thumb { background-color: rgba(112, 32, 50, 0.5); } 
        }
        @media (pointer: coarse) { 
          .scroll-estetico::-webkit-scrollbar { display: none; }
          .scroll-estetico { -ms-overflow-style: none; scrollbar-width: none; }
        }
      `}} />

      {imagenCompleta && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col justify-center items-center p-4 animate-fade-in" onClick={() => setImagenCompleta(null)}>
          <button onClick={() => setImagenCompleta(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors z-10 backdrop-blur-sm">✕</button>
          <img src={imagenCompleta} alt="Documento/Foto Ampliada" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-4">Toca en cualquier parte para cerrar</p>
        </div>
      )}

      <div className="bg-[#D65F08] pt-10 pb-24 px-4 md:px-8 rounded-b-[3rem] md:rounded-b-[4rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center relative z-10 gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto justify-center md:justify-start">
            <div className="bg-white p-3 rounded-2xl shadow-lg"><img src="/imju-elota.webp" alt="IMJU" className="w-12 h-12 md:w-14 md:h-14 object-contain" /></div>
            <div>
               <p className="text-orange-200 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Sesión: {adminActual.rol}</p>
               <h1 className="text-2xl md:text-4xl font-black text-white text-center md:text-left tracking-tight">Centro de Control</h1>
            </div>
          </div>
          <button onClick={() => { auth.signOut(); setAdminActual(null); window.location.href = "/"; }} className="bg-white/10 hover:bg-red-500 px-6 py-3.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all shadow-md w-full md:w-auto active:scale-95">Cerrar Sesión</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-12 md:-mt-14 relative z-20">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-slate-50 flex items-center justify-between hover:shadow-2xl transition-shadow">
            <div><p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Jóvenes Activos</p><p className="text-4xl md:text-5xl font-black text-[#D65F08]">{listaJovenes.length}</p></div>
            <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-50 rounded-[1.5rem] flex items-center justify-center text-2xl md:text-3xl shadow-inner border border-orange-100">🪪</div>
          </div>
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-slate-50 flex items-center justify-between hover:shadow-2xl transition-shadow">
            <div><p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Negocios Aliados</p><p className="text-4xl md:text-5xl font-black text-emerald-600">{listaNegocios.length}</p></div>
            <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-2xl md:text-3xl shadow-inner border border-emerald-100">🏪</div>
          </div>
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-slate-50 flex items-center justify-between hover:shadow-2xl transition-shadow">
            <div><p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Visitas del Mes</p><p className="text-4xl md:text-5xl font-black text-indigo-600">{visitasFiltradas.length}</p></div>
            <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-2xl md:text-3xl shadow-inner border border-indigo-100">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-full shadow-lg border border-slate-100 p-2.5 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto scroll-estetico pb-2 md:pb-0">
            <button onClick={() => cambiarPestaña("pendientes")} className={`relative whitespace-nowrap px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 md:flex-none text-center transition-all ${pestaña === "pendientes" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}>
              Solicitudes {(solicitudes.length + solicitudesNegocios.length) > 0 && <span className="absolute top-1 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white shadow-sm"></span>}
            </button>
            <button onClick={() => cambiarPestaña("jovenes")} className={`whitespace-nowrap px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 md:flex-none text-center transition-all ${pestaña === "jovenes" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}>Directorio Jóvenes</button>
            <button onClick={() => cambiarPestaña("negocios")} className={`whitespace-nowrap px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 md:flex-none text-center transition-all ${pestaña === "negocios" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}>Negocios</button>
            <button onClick={() => cambiarPestaña("publicaciones")} className={`whitespace-nowrap px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 md:flex-none text-center transition-all ${pestaña === "publicaciones" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}>Moderación</button>
            <button onClick={() => cambiarPestaña("visitas")} className={`whitespace-nowrap px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 md:flex-none text-center transition-all ${pestaña === "visitas" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}>Métricas</button>
            <button onClick={() => cambiarPestaña("avisos")} className={`whitespace-nowrap px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 md:flex-none text-center transition-all ${pestaña === "avisos" ? "bg-[#D65F08] text-white shadow-md" : "text-slate-500 hover:bg-orange-50"}`}>📢 Avisos</button>
            {adminActual.rol === "Master" && (
               <button onClick={() => cambiarPestaña("equipo")} className={`whitespace-nowrap px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 md:flex-none text-center transition-all ${pestaña === "equipo" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}>👮‍♂️ Equipo</button>
            )}
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {pestaña === "jovenes" && <button onClick={iniciarAltaJoven} className="flex-1 md:flex-none bg-[#D65F08] hover:bg-orange-900 text-white px-5 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-colors active:scale-95">+ Registrar Joven</button>}
            {pestaña === "negocios" && <button onClick={() => {cancelarEdicionNegocio(); setModalNegocio(true)}} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-colors active:scale-95">+ Crear Negocio</button>}
            {pestaña === "equipo" && adminActual.rol === "Master" && <button onClick={() => setModalAdmin(true)} className="flex-1 md:flex-none bg-slate-900 hover:bg-black text-white px-5 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-colors active:scale-95">+ Usuario</button>}
            {(pestaña === "jovenes" || pestaña === "negocios" || pestaña === "visitas") && (
              <button onClick={() => descargarExcel(pestaña)} className="flex-1 md:flex-none bg-[#107C41] hover:bg-green-700 text-white px-5 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-colors active:scale-95">📊 Exportar Excel</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 p-6 md:p-10 min-h-[500px] w-full">
          {(pestaña === "jovenes" || pestaña === "negocios") && (
            <div className="mb-8 relative animate-fade-in max-w-2xl">
              <input 
                type="text" placeholder={`Buscar en ${pestaña === "jovenes" ? "Jóvenes" : "Negocios"} por nombre, correo o código...`} 
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-full px-8 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#D65F08] focus:bg-white transition-all shadow-inner"
              />
              <span className="absolute right-6 top-4.5 text-slate-400 text-lg">🔍</span>
            </div>
          )}

          {cargando ? (
             <div className="flex flex-col items-center justify-center h-64"><div className="w-14 h-14 border-4 border-[#D65F08]/20 border-t-[#D65F08] rounded-full animate-spin mb-4"></div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Procesando Datos...</p></div>
          ) : (
            <div className="w-full overflow-x-auto scroll-estetico pb-4">
              
              {/* ========================================================= */}
              {/* NUEVA SECCIÓN DE PENDIENTES (JÓVENES Y NEGOCIOS) */}
              {/* ========================================================= */}
              {pestaña === "pendientes" && (
                <div className="min-w-[800px] animate-fade-in">
                   
                   <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
                      <button onClick={() => setSubPestañaPendientes("jovenes")} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subPestañaPendientes === "jovenes" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>👤 Jóvenes ({solicitudes.length})</button>
                      <button onClick={() => setSubPestañaPendientes("negocios")} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subPestañaPendientes === "negocios" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>🏪 Negocios ({solicitudesNegocios.length})</button>
                   </div>

                   {subPestañaPendientes === "jovenes" ? (
                     <>
                       <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-8 shadow-sm">
                          <h3 className="font-black text-amber-800 text-lg mb-1">Validación de Identidad</h3>
                          <p className="text-sm text-amber-700 font-medium">Comprueba visualmente que la foto de perfil coincida con el documento. <b>Haz clic en las imágenes para verlas en grande.</b></p>
                       </div>
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="border-b-2 border-slate-100">
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Aspirante y Documentos</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Decisión Final</th>
                             </tr>
                          </thead>
                          <tbody>
                             {solicitudes.length === 0 ? (
                                <tr><td colSpan={2} className="py-16 text-center text-slate-400 font-bold text-base bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">🎉 ¡Todo al día! No hay solicitudes pendientes de jóvenes.</td></tr>
                             ) : (
                                solicitudes.map(s => (
                                   <tr key={s.idFirebase} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                      <td className="py-6 pl-4">
                                         <div className="flex items-start gap-6">
                                            <div className="relative group cursor-pointer" onClick={() => setImagenCompleta(s.fotoPerfil)}>
                                               <img src={s.fotoPerfil} className="w-28 h-28 rounded-[1.5rem] object-cover shadow-lg border-4 border-white group-hover:scale-105 transition-transform" />
                                               <div className="absolute inset-0 bg-black/30 rounded-[1.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-xs font-black uppercase tracking-widest">Ampliar</span></div>
                                            </div>
                                            <div className="flex flex-col justify-center pt-2">
                                               <p className="font-black text-slate-900 text-xl tracking-tight">{s.nombreCompleto}</p>
                                               <p className="text-sm font-bold text-slate-500 mb-3">
                                                  <span className="text-amber-600 font-black">{calcularEdad(s.fechaNacimiento)} años</span> • {s.correo} • {s.genero || 'Género no especificado'}
                                               </p>
                                               <button onClick={() => setImagenCompleta(s.documentoProbatorio)} className="bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-[1rem] flex items-center w-fit gap-2 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm active:scale-95">
                                                  👀 Ver Documento Probatorio
                                               </button>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="py-6 text-right pr-4 align-middle">
                                         <div className="flex flex-col items-end gap-3">
                                            <button onClick={() => aprobarSolicitud(s)} className="w-40 bg-emerald-500 text-white font-black py-4 px-4 rounded-[1.2rem] text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95">✅ Aprobar Joven</button>
                                            <button onClick={() => rechazarSolicitud(s)} className="w-40 bg-red-50 text-red-600 font-black py-3.5 px-4 rounded-[1.2rem] text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100 active:scale-95">❌ Rechazar</button>
                                         </div>
                                      </td>
                                   </tr>
                                ))
                             )}
                          </tbody>
                       </table>
                     </>
                   ) : (
                     <>
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="border-b-2 border-slate-100">
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Negocio y Evidencia</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Decisión</th>
                             </tr>
                          </thead>
                          <tbody>
                             {solicitudesNegocios.length === 0 ? (
                                <tr><td colSpan={3} className="py-16 text-center text-slate-400 font-bold text-base bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">No hay negocios pendientes de revisión.</td></tr>
                             ) : (
                                solicitudesNegocios.map(n => (
                                   <tr key={n.idFirebase} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                      <td className="py-6 pl-4">
                                         <div className="flex items-start gap-4">
                                            <div className="relative group cursor-pointer shrink-0" onClick={() => setImagenCompleta(n.evidenciaFachada || n.logo)}>
                                               <img src={n.evidenciaFachada || n.logo} className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-slate-200 group-hover:scale-105 transition-transform" />
                                               <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-black text-center py-1 rounded-b-2xl uppercase tracking-widest">Ver Fachada</div>
                                            </div>
                                            <div className="pt-1">
                                               <p className="font-black text-slate-900 text-lg tracking-tight mb-1">{n.nombreComercial}</p>
                                               <span className="bg-emerald-50 text-emerald-700 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md border border-emerald-100">{n.giro}</span>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="py-6 align-middle">
                                         <p className="text-sm font-bold text-slate-700 mb-1">{n.correo}</p>
                                         <p className="text-[10px] font-black text-slate-400">WhatsApp: {n.telefono}</p>
                                      </td>
                                      <td className="py-6 text-right pr-4 align-middle">
                                         <div className="flex flex-col items-end gap-2">
                                            <button onClick={() => aprobarNegocioAdmin(n)} className="w-36 bg-emerald-500 text-white font-black py-3 px-4 rounded-xl text-[9px] uppercase tracking-widest hover:bg-emerald-600 shadow-md transition-all active:scale-95">✅ Aprobar</button>
                                            <button onClick={() => rechazarNegocioAdmin(n)} className="w-36 bg-red-50 text-red-600 font-black py-3 px-4 rounded-xl text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100 active:scale-95">❌ Rechazar</button>
                                         </div>
                                      </td>
                                   </tr>
                                ))
                             )}
                          </tbody>
                       </table>
                     </>
                   )}
                </div>
              )}

              {pestaña === "jovenes" && (
                <div className="min-w-[800px] animate-fade-in">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b-2 border-slate-100"><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Joven Registrado</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil Social</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acceso Sistema</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-2">Acciones</th></tr></thead>
                    <tbody>
                      {jovenesFiltrados.length === 0 ? (
                        <tr><td colSpan={4} className="py-16 text-center text-slate-400 font-bold text-base bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">No se encontraron jóvenes con esa búsqueda.</td></tr>
                      ) : (
                        jovenesFiltrados.map(j => {
                          const edadCalculada = j.fechaNacimiento ? calcularEdad(j.fechaNacimiento) : j.edad;
                          const enPeligro = edadCalculada >= 29;
                          return (
                          <tr key={j.idFirebase} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-5 pl-2">
                              <div className="flex items-center gap-4">
                                <img src={j.fotoPerfil} className={`w-14 h-14 rounded-[1rem] object-cover shadow-sm cursor-pointer hover:scale-105 transition-transform ${enPeligro ? 'border-2 border-orange-400' : ''}`} onClick={() => setImagenCompleta(j.fotoPerfil)} />
                                <div><p className="font-black text-slate-800 text-sm">{j.nombreCompleto}</p><p className="text-[10px] font-bold text-slate-400 mt-0.5"><span className={enPeligro ? 'text-orange-500 font-black' : ''}>{edadCalculada} años</span> {j.localidad ? `• ${j.localidad}` : ""}</p></div>
                              </div>
                            </td>
                            <td className="py-5"><p className="text-xs font-bold text-slate-700 mb-1">{j.ocupacion || "Sin registro"}</p><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{j.genero || 'NO REGISTRADO'}</span></td>
                            <td className="py-5"><p className="text-xs font-bold text-slate-700 mb-1">{j.correo}</p><span className="bg-[#D65F08]/10 text-[#D65F08] font-mono text-[10px] font-black px-3 py-1.5 rounded-lg border border-orange-100">{j.codigoUnicoQR}</span></td>
                            <td className="py-5 text-right pr-2">
                              <div className="flex flex-col items-end gap-2">
                                <button onClick={() => iniciarEdicionJoven(j)} className="w-24 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-black py-2 rounded-xl text-[9px] uppercase tracking-widest transition-colors active:scale-95 border border-blue-100">Editar</button>
                                <button onClick={() => eliminarJoven(j.idFirebase, j.nombreCompleto)} className="w-24 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black py-2 rounded-xl text-[9px] uppercase tracking-widest transition-colors active:scale-95 border border-red-100">Borrar</button>
                              </div>
                            </td>
                          </tr>
                        )})
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {pestaña === "negocios" && (
                <div className="min-w-[700px] animate-fade-in">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b-2 border-slate-100"><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Comercio y Contacto</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giro</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acceso Panel Negocios</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-2">Acciones</th></tr></thead>
                    <tbody>
                      {negociosFiltrados.length === 0 ? (
                        <tr><td colSpan={4} className="py-16 text-center text-slate-400 font-bold text-base bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">No se encontraron negocios.</td></tr>
                      ) : (
                        negociosFiltrados.map(n => (
                          <tr key={n.idFirebase} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-5 pl-2">
                               <div className="flex items-center gap-4">
                                  <img src={n.logo} onClick={() => setImagenCompleta(n.logo)} className="w-14 h-14 rounded-[1rem] object-contain bg-white shadow-sm border border-slate-100 p-1 cursor-pointer hover:scale-105 transition-transform" />
                                  <div>
                                     <p className="font-black text-slate-800 text-sm">{n.nombreComercial}</p>
                                     <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">📞 {n.telefono || "Sin teléfono"}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="py-5"><span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">{n.giro}</span></td>
                            <td className="py-5 text-sm font-bold text-slate-700">{n.correo}<br/><span className="text-[10px] font-mono text-slate-400 mt-1 block">Pass: {n.contrasena}</span></td>
                            <td className="py-5 text-right pr-2 flex flex-col items-end gap-2">
                              <button onClick={() => iniciarEdicionNegocio(n)} className="w-24 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-black py-2 rounded-xl text-[9px] uppercase tracking-widest transition-colors active:scale-95 border border-blue-100">Editar</button>
                              <button onClick={() => eliminarNegocio(n.idFirebase, n.nombreComercial)} className="w-24 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black py-2 rounded-xl text-[9px] uppercase tracking-widest transition-colors active:scale-95 border border-red-100">Borrar</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {pestaña === "publicaciones" && (
                 <div className="animate-fade-in w-full max-w-5xl mx-auto space-y-12">
                    <div>
                       <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs border-b border-slate-100 pb-3 flex items-center gap-2"><span className="text-xl">🎟️</span> Cupones / Beneficios Activos</h3>
                       {listaPromos.length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                             <p className="text-slate-400 font-bold text-sm">No hay cupones publicados por los negocios.</p>
                          </div>
                       ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {listaPromos.map(p => (
                                <div key={p.idFirebase} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                   <div>
                                      <div className="flex justify-between items-start mb-3">
                                         <p className="font-black text-sm text-slate-900">{p.titulo}</p>
                                         <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100">{p.estatus}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-medium mb-3 line-clamp-2">{p.descripcion}</p>
                                      <div className="text-[9px] font-bold text-slate-400 space-y-1 mb-4">
                                         <p>🏪 Negocio: <span className="text-[#D65F08]">{p.nombreNegocio}</span></p>
                                         <p>👑 Nivel: {p.nivelRequerido}</p>
                                      </div>
                                   </div>
                                   <button onClick={() => eliminarPublicacion("promociones", p.idFirebase)} className="w-full bg-red-50 text-red-600 font-black py-3 rounded-xl text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors border border-red-100 active:scale-95 flex items-center justify-center gap-2">
                                      🗑️ Eliminar Definitivamente
                                   </button>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>

                    <div>
                       <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs border-b border-slate-100 pb-3 flex items-center gap-2"><span className="text-xl">💼</span> Bolsa de Trabajo (Vacantes Activas)</h3>
                       {listaEmpleos.length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                             <p className="text-slate-400 font-bold text-sm">No hay vacantes de empleo publicadas.</p>
                          </div>
                       ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {listaEmpleos.map(e => (
                                <div key={e.idFirebase} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                   <div>
                                      <div className="flex justify-between items-start mb-3">
                                         <p className="font-black text-sm text-slate-900">{e.titulo}</p>
                                         <span className="text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100">{e.tipo}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-medium mb-3 line-clamp-2">{e.descripcion}</p>
                                      <div className="text-[9px] font-bold text-slate-400 space-y-1 mb-4 flex justify-between">
                                         <div>
                                            <p>🏪 Negocio: <span className="text-[#D65F08]">{e.nombreNegocio}</span></p>
                                            <p>📞 Contacto: {e.telefonoContacto}</p>
                                         </div>
                                         <div className="text-right">
                                            <p className="text-emerald-500 font-black text-xs">{e.sueldo}</p>
                                         </div>
                                      </div>
                                   </div>
                                   <button onClick={() => eliminarPublicacion("empleos", e.idFirebase)} className="w-full bg-red-50 text-red-600 font-black py-3 rounded-xl text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors border border-red-100 active:scale-95 flex items-center justify-center gap-2">
                                      🗑️ Eliminar Definitivamente
                                   </button>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              )}

              {pestaña === "visitas" && (
                <div className="min-w-[700px] animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-5 rounded-3xl mb-8 gap-4 shadow-inner border border-slate-100">
                    <p className="text-sm font-black text-slate-800 pl-2">Filtrar Historial por Mes:</p>
                    <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="text-xs font-black text-[#D65F08] bg-white px-5 py-3.5 rounded-xl shadow-sm outline-none border border-slate-200 w-full md:w-auto cursor-pointer" />
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100">
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Fecha y Hora</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Negocio</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joven Beneficiado</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Promoción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitasFiltradas.length === 0 ? (
                        <tr><td colSpan={4} className="py-16 text-center text-slate-400 font-bold text-base bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">No hay movimientos en el mes seleccionado.</td></tr>
                      ) : (
                        visitasFiltradas.map(v => (
                          <tr key={v.idFirebase} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-5 pl-2 text-[11px] font-black text-slate-500 uppercase">{new Date(v.fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}</td>
                            <td className="py-5 font-black text-emerald-600 text-sm">{v.nombreNegocio}</td>
                            <td className="py-5 text-sm font-black text-slate-800">{v.nombreJoven}</td>
                            <td className="py-5"><span className="bg-[#D65F08]/10 text-[#D65F08] px-4 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest border border-orange-100/50">{v.nombrePromo}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {pestaña === "avisos" && (
                <div className="animate-fade-in max-w-3xl mx-auto">
                   <div className="bg-gradient-to-br from-orange-50 to-white p-8 md:p-10 rounded-[2.5rem] border border-orange-100 mb-10 shadow-sm">
                      <h3 className="text-2xl font-black text-[#D65F08] mb-6 tracking-tight">📣 Megáfono del Sistema</h3>
                      <form onSubmit={publicarAnuncio} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                           <select value={audienciaAviso} onChange={e => setAudienciaAviso(e.target.value)} className="bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-[#D65F08] w-full sm:w-1/3 shadow-sm transition-all">
                              <option value="Todos">Para Todos</option><option value="Jovenes">Solo Jóvenes</option><option value="Negocios">Solo Negocios</option>
                           </select>
                           <input type="text" value={tituloAviso} onChange={e => setTituloAviso(e.target.value)} placeholder="Título del Aviso..." className="w-full sm:w-2/3 bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-[#D65F08] shadow-sm transition-all" required />
                        </div>
                        <textarea value={mensajeAviso} onChange={e => setMensajeAviso(e.target.value)} placeholder="Escribe el mensaje detallado aquí..." className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-[#D65F08] h-32 resize-none shadow-sm transition-all" required></textarea>
                        <button type="submit" disabled={cargando} className="w-full bg-[#D65F08] text-white font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-slate-900 shadow-lg hover:shadow-orange-900/30 transition-all active:scale-95 mt-2">Lanzar Aviso 🚀</button>
                      </form>
                   </div>
                   
                   <h4 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs border-b border-slate-100 pb-3">Avisos Activos</h4>
                   <div className="space-y-4">
                      {anuncios.map(a => (
                        <div key={a.idFirebase} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-start gap-4 hover:shadow-md transition-shadow">
                           <div>
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg mb-4 inline-block border border-slate-200">{a.audiencia}</span>
                              <h5 className="font-black text-xl text-slate-900 leading-tight tracking-tight mb-2">{a.titulo}</h5>
                              <p className="text-sm font-medium text-slate-600">{a.mensaje}</p>
                           </div>
                           <button onClick={() => eliminarAnuncio(a.idFirebase)} className="w-12 h-12 rounded-[1.2rem] bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors flex-shrink-0 shadow-sm text-lg active:scale-95 border border-red-100">🗑️</button>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {pestaña === "equipo" && adminActual?.rol === "Master" && (
                <div className="animate-fade-in max-w-3xl mx-auto">
                   <div className="bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl mb-10 text-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                      <div className="relative z-10">
                        <h3 className="text-3xl font-black mb-2 flex items-center gap-3 tracking-tight">🔐 Control de Accesos</h3>
                        <p className="text-sm text-slate-400 font-medium">Administra quién puede entrar al panel de control.</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      {listaAdmins.map(admin => (
                        <div key={admin.idFirebase} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                           <div className="flex items-center gap-5">
                             <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-2xl font-black text-white shadow-md ${admin.rol === 'Master' ? 'bg-gradient-to-br from-fuchsia-600 to-violet-700' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>{admin.correo.charAt(0).toUpperCase()}</div>
                             <div>
                                <h5 className="font-black text-lg text-slate-900 tracking-tight">{admin.correo}</h5>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mt-1.5 inline-block ${admin.rol === 'Master' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-blue-100 text-blue-700'}`}>{admin.rol}</span>
                             </div>
                           </div>
                           {adminActual.idFirebase !== admin.idFirebase && (<button onClick={() => eliminarAdministrador(admin.idFirebase, admin.correo)} className="text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-5 py-3.5 rounded-xl transition-colors active:scale-95 border border-red-100 w-full md:w-auto">Revocar Acceso</button>)}
                        </div>
                      ))}
                   </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* MODAL ALTA/EDICIÓN DE JOVEN CON CÁMARA */}
      {modalJoven && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-4 animate-fade-in" onClick={cancelarEdicionJoven}>
          <div className="bg-[#F3F5F9] w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto rounded-t-[3rem] md:rounded-[3rem] p-8 shadow-2xl relative scroll-estetico animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 md:hidden"></div>
            <button onClick={cancelarEdicionJoven} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 font-bold transition-colors shadow-sm border border-slate-200">✕</button>
            <h3 className="text-2xl font-black text-[#D65F08] mb-6 tracking-tight text-center">{modoEdicion ? "Editar Registro" : "Alta de Joven (Oficina)"}</h3>
            
            <form onSubmit={guardarJoven} className="space-y-4">
              
              {/* SECCIÓN DE FOTOGRAFÍA (CÁMARA / SUBIR) */}
              {mostrarCamara ? (
                <div className="relative w-full h-72 rounded-[2rem] overflow-hidden mb-6 border-4 border-white shadow-md bg-black">
                  <Camera ref={cameraRef} facingMode={camaraFrontal ? "user" : "environment"} aspectRatio={16/9} errorMessages={{}} />
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                     <button type="button" onClick={() => setMostrarCamara(false)} className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest border border-white/30">Cancelar</button>
                     <button type="button" onClick={() => { const foto = cameraRef.current?.takePhoto(); if (foto) setFotoBase64(foto); setMostrarCamara(false); }} className="bg-[#D65F08] text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg border border-orange-900/50">📸 Capturar</button>
                  </div>
                  <button type="button" onClick={() => setCamaraFrontal(!camaraFrontal)} className="absolute top-4 right-4 bg-black/40 p-3 rounded-full backdrop-blur-md text-white">🔄</button>
                </div>
              ) : (
                <div className="flex flex-col items-center mb-6">
                   <img src={fotoBase64 || "/imju-elota.webp"} className={`w-32 h-32 rounded-[2rem] object-cover shadow-md border-4 border-white mb-4 ${!fotoBase64 && 'p-4 opacity-50'}`} />
                   <div className="flex gap-3">
                      <label className="text-[10px] bg-white text-slate-600 font-black uppercase tracking-widest px-5 py-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm flex items-center gap-2">
                         📁 Subir Archivo
                         <input type="file" accept="image/*" onChange={(e) => manejarSubidaArchivo(e, false)} className="hidden" />
                      </label>
                      <button type="button" onClick={() => setMostrarCamara(true)} className="text-[10px] bg-white text-[#D65F08] font-black uppercase tracking-widest px-5 py-3 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors border border-orange-200 shadow-sm flex items-center gap-2">
                         📸 Tomar Foto
                      </button>
                   </div>
                </div>
              )}

              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-[#D65F08] font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Nombre Completo" required />
              
              <div className="grid grid-cols-2 gap-4">
                 <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-[#D65F08] font-bold text-slate-500 transition-all outline-none shadow-sm" required />
                 <select value={genero} onChange={(e) => setGenero(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-[#D65F08] font-bold text-slate-700 transition-all outline-none shadow-sm" required>
                    <option value="">Género...</option><option value="Mujer">Mujer</option><option value="Hombre">Hombre</option><option value="No Binario">No Binario</option><option value="Prefiero no decir">Prefiero no decir</option>
                 </select>
              </div>

              <input type="text" value={localidad} onChange={(e) => setLocalidad(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-[#D65F08] font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Localidad o Colonia" required />
              <input type="text" value={ocupacion} onChange={(e) => setOcupacion(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-[#D65F08] font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Ocupación (Ej: Estudiante en UAdeO)" required />
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-[#D65F08] font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Correo Electrónico (Para accesos)" required disabled={modoEdicion} />
              
              <button type="submit" disabled={cargando} className={`w-full mt-6 text-white font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest transition-all active:scale-95 ${cargando ? "bg-slate-400" : "bg-[#D65F08] hover:bg-slate-900 shadow-xl shadow-orange-900/20"}`}>
                {modoEdicion ? "Guardar Cambios" : "Registrar y Activar Joven"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL ALTA/EDICIÓN DE NEGOCIOS === */}
      {modalNegocio && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-4 animate-fade-in" onClick={cancelarEdicionNegocio}>
          <div className="bg-[#F3F5F9] w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto rounded-t-[3rem] md:rounded-[3rem] p-8 pb-10 shadow-2xl relative scroll-estetico animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 md:hidden"></div>
            <button onClick={cancelarEdicionNegocio} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 font-bold transition-colors z-50 shadow-sm border border-slate-200">✕</button>
            <h3 className="text-2xl font-black text-emerald-600 mb-6 tracking-tight text-center">{modoEdicionNegocio ? "Editar" : "Alta"} de Negocio Aliado</h3>
            
            <form onSubmit={modoEdicionNegocio ? actualizarNegocio : registrarNegocio} className="space-y-4 pb-4">
              
              <div className="flex flex-col items-center mb-6">
                 <img src={logoNegocioBase64 || "/imju-elota.webp"} className="w-28 h-28 rounded-[2rem] object-contain bg-white p-2 shadow-sm border-2 border-slate-100 mb-4" />
                 <label className="text-[10px] bg-white text-emerald-700 font-black uppercase tracking-widest px-5 py-3 rounded-full cursor-pointer hover:bg-emerald-50 transition-colors border border-emerald-200 shadow-sm">
                    {modoEdicionNegocio ? "🔄 Cambiar Logo" : "📁 Subir Logo"}
                    <input type="file" accept="image/*" onChange={(e) => manejarSubidaArchivo(e, true)} className="hidden" />
                 </label>
              </div>

              <input type="text" value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-emerald-500 font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Nombre Comercial" required />
              <input type="text" value={giroNegocio} onChange={(e) => setGiroNegocio(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-emerald-500 font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Giro (Restaurante, Ropa, etc)" required />
              
              <div className="grid grid-cols-2 gap-4">
                 <input type="text" value={horarioNegocio} onChange={(e) => setHorarioNegocio(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-emerald-500 font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Horario (Lun-Sab 9a6)" required />
                 <input type="number" value={telefonoNegocio} onChange={(e) => setTelefonoNegocio(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-emerald-500 font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="WhatsApp (10 dig)" required />
              </div>

              <input type="email" value={correoNegocio} onChange={(e) => setCorreoNegocio(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-emerald-500 font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Correo para Acceso" required disabled={modoEdicionNegocio} />
              {modoEdicionNegocio ? (
                <input type="text" value={passwordNegocio} onChange={(e) => setPasswordNegocio(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-emerald-500 font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Contraseña asignada" required />
              ) : (
                <div className="w-full border-2 border-emerald-100 rounded-2xl px-5 py-4 bg-emerald-50 text-emerald-800 text-sm font-bold shadow-sm">
                  🔐 La contraseña se generará automáticamente y se enviará al correo del negocio.
                </div>
              )}
              
              <div className="pt-2">
                 <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500 pl-2">Ubicación GPS (Coordenadas)</label>
                 <div className="w-full h-48 rounded-[2rem] overflow-hidden border-2 border-slate-200 relative z-0 shadow-sm">
                    <MapContainer center={[latNegocio, lngNegocio]} zoom={15} style={{ height: "100%", width: "100%" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker
                         position={[latNegocio, lngNegocio]}
                         draggable={true}
                         eventHandlers={{
                           dragend: (e) => {
                             const marker = e.target;
                             const position = marker.getLatLng();
                             setLatNegocio(position.lat);
                             setLngNegocio(position.lng);
                           },
                         }}
                      />
                    </MapContainer>
                 </div>
                 <p className="text-[9px] text-slate-500 mt-2 text-center font-bold">Arrastra el pin azul al lugar exacto del negocio en Elota.</p>
              </div>
              
              <button type="submit" disabled={cargando} className={`w-full mt-6 text-white font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest transition-all active:scale-95 ${cargando ? "bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/30"}`}>
                {modoEdicionNegocio ? "Actualizar Negocio" : "Guardar Negocio"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR USUARIO ADMIN */}
      {modalAdmin && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-4 animate-fade-in" onClick={() => setModalAdmin(false)}>
          <div className="bg-[#F3F5F9] w-full max-w-sm rounded-t-[3rem] md:rounded-[3rem] p-8 shadow-2xl relative animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 md:hidden"></div>
            <button onClick={() => setModalAdmin(false)} className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 font-bold transition-colors shadow-sm border border-slate-200">✕</button>
            <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight text-center">Nuevo Usuario</h3>
            <form onSubmit={crearAdministrador} className="space-y-4">
              <input type="email" value={nuevoCorreoAdmin} onChange={(e) => setNuevoCorreoAdmin(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-slate-900 font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Correo IMJU" required />
              <input type="text" value={nuevoPassAdmin} onChange={(e) => setNuevoPassAdmin(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-slate-900 font-bold text-slate-700 transition-all outline-none shadow-sm" placeholder="Contraseña temporal" required />
              <select value={nuevoRolAdmin} onChange={(e) => setNuevoRolAdmin(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 bg-white focus:border-slate-900 font-bold text-slate-700 transition-all outline-none shadow-sm">
                <option value="Staff">Nivel: Staff (Captura)</option><option value="Master">Nivel: Master (Total)</option>
              </select>
              <button type="submit" disabled={cargando} className={`w-full mt-4 text-white font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest transition-all active:scale-95 ${cargando ? "bg-slate-400" : "bg-slate-900 hover:bg-black shadow-xl"}`}>Crear Usuario</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
