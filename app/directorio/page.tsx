"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import dynamic from "next/dynamic";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

// Importación dinámica del mapa
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export default function DirectorioNegocios() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [promociones, setPromociones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("lista"); // 'lista' o 'mapa'
  const [busqueda, setBusqueda] = useState("");
  
  // Modal de detalles
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<any>(null);

  // Centro de Elota
  const centroElota: [number, number] = [23.92173, -106.89264];

  useEffect(() => {
    // FIX para Vercel y Leaflet
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });

    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Cargar todos los negocios
      const snapNegocios = await getDocs(query(collection(db, "negocios"), where("estatus", "==", "Activo")));
      const tempNegocios: any[] = [];
      snapNegocios.forEach((doc) => {
        tempNegocios.push({ idFirebase: doc.id, ...doc.data() });
      });
      setNegocios(tempNegocios);

      // 2. Cargar todas las promociones activas en la plataforma
      const snapPromos = await getDocs(query(collection(db, "promociones"), where("estatus", "==", "Activa")));
      const tempPromos: any[] = [];
      snapPromos.forEach((doc) => {
        tempPromos.push({ idFirebase: doc.id, ...doc.data() });
      });
      setPromociones(tempPromos);

    } catch (error) {
      console.error("Error al cargar el directorio:", error);
    }
    setCargando(false);
  };

  const negociosFiltrados = negocios.filter(n => 
    n.nombreComercial?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.giro?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#F3F5F9] dark:bg-slate-900 font-sans pb-20 selection:bg-[#D65F08] selection:text-white transition-colors">
      
      {/* ENCABEZADO INSTITUCIONAL */}
      <div className="bg-[#D65F08] dark:bg-slate-900 pt-6 pb-16 px-4 rounded-b-[3rem] shadow-xl relative z-10 border-b-4 border-[#F57C00]">
        
        {/* BOTÓN REGRESAR */}
        <div className="max-w-4xl mx-auto flex justify-start mb-2">
          <Link href="/">
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors backdrop-blur-sm border border-white/20">
              ← Volver al Inicio
            </button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center mt-2">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-[2rem] flex items-center justify-center p-3 mb-4 border border-white/20 shadow-inner">
            <img src="/imju-elota.webp" alt="IMJU" className="w-full h-full object-contain filter brightness-0 invert" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight drop-shadow-md">Directorio Aliado</h1>
          <p className="text-orange-200 dark:text-orange-400 text-xs md:text-sm font-medium uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Descubre dónde usar tu Tarjeta Joven
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        
        {/* CONTROLES (Thumb-Friendly) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 mb-8 flex flex-col md:flex-row gap-4 items-center">
          
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Buscar por nombre o giro (Ej. Comida)..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-[#D65F08]/20 dark:focus:ring-orange-500/20 transition-all placeholder:text-slate-400"
            />
            <span className="absolute right-5 top-4 text-slate-400 text-lg">🔍</span>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-2xl w-full md:w-auto flex-shrink-0 shadow-inner">
            <button onClick={() => setVista("lista")} className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vista === "lista" ? "bg-white dark:bg-slate-800 text-[#D65F08] dark:text-orange-400 shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>📋 Lista</button>
            <button onClick={() => setVista("mapa")} className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vista === "mapa" ? "bg-white dark:bg-slate-800 text-[#D65F08] dark:text-orange-400 shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>🗺️ Mapa</button>
          </div>
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-14 h-14 border-4 border-[#D65F08]/20 border-t-[#D65F08] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Aliados...</p>
          </div>
        ) : (
          <>
            {/* VISTA DE LISTA (Tarjetas Responsivas) */}
            {vista === "lista" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                {negociosFiltrados.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <span className="text-4xl block mb-3">🧐</span>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">No se encontraron negocios con ese nombre.</p>
                  </div>
                ) : (
                  negociosFiltrados.map((n) => (
                    <div key={n.idFirebase} onClick={() => setNegocioSeleccionado(n)} className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer border border-slate-100 dark:border-slate-700 flex flex-col group relative overflow-hidden">
                      {/* Efecto hover visual */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D65F08]/5 dark:bg-orange-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-[1.2rem] bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-sm group-hover:shadow-md transition-shadow">
                          <img src={n.logo || "/imju-elota.webp"} alt={n.nombreComercial} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#F57C00] bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/50 px-2.5 py-1 rounded-md mb-2 inline-block truncate max-w-full">{n.giro}</span>
                          <h3 className="font-black text-slate-800 dark:text-white leading-tight truncate group-hover:text-[#D65F08] dark:group-hover:text-orange-400 transition-colors text-lg">{n.nombreComercial}</h3>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex -space-x-2">
                           <span className="w-6 h-6 rounded-full bg-orange-100 text-xs flex items-center justify-center z-10 border border-white">🏷️</span>
                           <span className="w-6 h-6 rounded-full bg-emerald-100 text-xs flex items-center justify-center z-0 border border-white">🎉</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-[#D65F08] dark:group-hover:text-orange-400 transition-colors">
                          Ver Promos →
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VISTA DE MAPA */}
            {vista === "mapa" && (
              <div className="h-[65vh] min-h-[450px] bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-800 overflow-hidden animate-fade-in relative z-0">
                <MapContainer center={centroElota} zoom={15} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {negociosFiltrados.map((n) => (
                    <Marker key={n.idFirebase} position={[n.lat || 23.92173, n.lng || -106.89264]}>
                      <Popup className="rounded-2xl overflow-hidden shadow-2xl border-0">
                        <div className="text-center p-2 min-w-[160px]">
                          <img src={n.logo || "/imju-elota.webp"} className="w-14 h-14 mx-auto rounded-xl mb-3 border-2 border-slate-100 object-contain shadow-sm bg-white" />
                          <h4 className="font-black text-slate-800 text-base mb-1 leading-tight">{n.nombreComercial}</h4>
                          <span className="text-[9px] font-black text-[#F57C00] bg-orange-50 px-2 py-1 rounded-md uppercase tracking-widest block mb-3">{n.giro}</span>
                          <button onClick={() => setNegocioSeleccionado(n)} className="bg-[#D65F08] hover:bg-slate-900 text-white text-[10px] font-black px-4 py-2.5 rounded-xl uppercase tracking-widest w-full transition-colors shadow-md">Abrir Perfil</button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                
                {/* Etiqueta flotante en el mapa */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-200 z-[400] flex items-center gap-2 pointer-events-none">
                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">La Cruz, Elota</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL DE PERFIL DEL NEGOCIO (Estilo App Nativa) */}
      {negocioSeleccionado && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-6 animate-fade-in" onClick={() => setNegocioSeleccionado(null)}>
          <div className="bg-[#F3F5F9] dark:bg-slate-900 w-full max-w-md h-[92vh] md:h-auto md:max-h-[85vh] overflow-y-auto rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
            
            {/* Header del Perfil */}
            <div className="bg-white dark:bg-slate-800 p-8 pt-10 rounded-b-[2.5rem] shadow-sm relative shrink-0 text-center border-b border-slate-100 dark:border-slate-700">
               {/* Barrita para deslizar en celular */}
               <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 md:hidden"></div>
               
               <button onClick={() => setNegocioSeleccionado(null)} className="absolute top-6 right-6 w-8 h-8 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-[#D65F08] shadow-sm font-bold transition-colors">✕</button>
               
               <div className="w-28 h-28 mx-auto rounded-[2rem] bg-white border-4 border-slate-50 dark:border-slate-700 shadow-xl mb-5 overflow-hidden flex items-center justify-center p-2">
                 <img src={negocioSeleccionado.logo || "/imju-elota.webp"} alt="Logo" className="w-full h-full object-contain" />
               </div>
               
               <span className="text-[10px] font-black uppercase tracking-widest text-[#F57C00] bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 px-3 py-1 rounded-full mb-3 inline-block shadow-sm">
                 {negocioSeleccionado.giro}
               </span>
               
               <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-2">{negocioSeleccionado.nombreComercial}</h2>
               <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">⭐ Aliado Oficial IMJU</p>
            </div>

            {/* Contenido del Perfil */}
            <div className="p-6 flex-1 space-y-4">
               
               {/* 🕒 NUEVO: Horarios y Contacto (Thumb-Friendly) */}
               <div className="grid grid-cols-2 gap-3 mb-2">
                 {/* HORARIOS */}
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl mb-1">🕒</span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Horario</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {negocioSeleccionado.horario ? negocioSeleccionado.horario : "Consulta en el local"}
                    </p>
                 </div>
                 
                 {/* CONTACTO / WHATSAPP */}
                 {negocioSeleccionado.telefono ? (
                   <a href={`https://wa.me/52${negocioSeleccionado.telefono}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-green-600 transition-colors p-4 rounded-[2rem] shadow-sm text-center flex flex-col items-center justify-center gap-1 group">
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">💬</span>
                      <p className="text-[9px] font-black uppercase tracking-widest text-green-100">Contactar</p>
                      <p className="text-xs font-bold text-white">WhatsApp</p>
                   </a>
                 ) : (
                   <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-1 opacity-50">
                      <span className="text-2xl mb-1">📵</span>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sin Teléfono</p>
                   </div>
                 )}
               </div>

               {/* Menú del Negocio (Si tiene) */}
               {negocioSeleccionado.menuImagen && (
                 <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white mb-3 flex items-center gap-2">📖 Ver Menú / Catálogo</h3>
                   <div className="w-full h-32 rounded-xl overflow-hidden relative group cursor-pointer border border-slate-200 dark:border-slate-600">
                      <img src={negocioSeleccionado.menuImagen} alt="Menú" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                         <span className="bg-white/90 text-slate-900 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">Ver Completo</span>
                      </div>
                   </div>
                 </div>
               )}

               {/* Sección Promociones */}
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white mb-3 flex items-center gap-2 pt-2 ml-1">
                 🎁 Beneficios Activos
               </h3>
               
               <div className="space-y-3 pb-8">
                 {promociones.filter(p => p.idNegocio === negocioSeleccionado.idFirebase).length === 0 ? (
                   <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="text-4xl mb-3 opacity-50">🏷️</p>
                     <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Sin beneficios publicados.</p>
                     <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-2">¡Vuelve a revisar pronto!</p>
                   </div>
                 ) : (
                   promociones.filter(p => p.idNegocio === negocioSeleccionado.idFirebase).map(promo => (
                     <div key={promo.idFirebase} className="bg-white dark:bg-slate-800 border border-orange-100 dark:border-orange-900/30 shadow-md p-5 rounded-[2rem] flex flex-col relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-[#D65F08]/5 dark:bg-orange-500/5 rounded-bl-full pointer-events-none"></div>
                       
                       <div className="flex items-start justify-between mb-3">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/50 rounded-xl flex items-center justify-center text-xl shadow-inner border border-orange-100 dark:border-orange-900/50">🎟️</div>
                            <h4 className="font-black text-[#D65F08] dark:text-orange-400 text-lg leading-tight tracking-tight pr-4">{promo.titulo}</h4>
                         </div>
                       </div>
                       
                       <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{promo.descripcion}</p>
                       
                       <div className="flex flex-wrap items-center gap-2 mt-auto">
                         <span className="text-[9px] font-black text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-900/50 uppercase tracking-widest">
                           ⏳ Expira: {promo.fechaVencimiento ? new Date(promo.fechaVencimiento).toLocaleDateString() : "Sin fecha"}
                         </span>
                         {promo.nivelRequerido && promo.nivelRequerido !== "Clásica" && (
                           <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm ${promo.nivelRequerido === 'Black' ? 'bg-slate-900 text-fuchsia-400 border border-fuchsia-900' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700'}`}>
                             Solo Nivel {promo.nivelRequerido}
                           </span>
                         )}
                       </div>
                     </div>
                   ))
                 )}
               </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}
