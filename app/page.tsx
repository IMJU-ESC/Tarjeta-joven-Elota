"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Inicio() {
  const router = useRouter();
  const [revisando, setRevisando] = useState(true);

  useEffect(() => {
    const sesionJoven = localStorage.getItem("sesionJoven");
    const sesionNegocio = localStorage.getItem("sesionNegocio");

    if (sesionJoven) {
      router.push("/tarjeta");
    } else if (sesionNegocio) {
      router.push("/portal-negocios");
    } else {
      setRevisando(false);
    }
  }, [router]);

  if (revisando) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-100 border-t-[#F57C00] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando IMJU...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F5F9] dark:bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden font-sans px-6 py-12 transition-colors">
      
      {/* LÍNEA DECORATIVA INSTITUCIONAL */}
      <div className="absolute top-0 left-0 w-full h-1.5 flex">
        <div className="w-1/3 h-full bg-[#D65F08]"></div>
        <div className="w-1/3 h-full bg-white"></div>
        <div className="w-1/3 h-full bg-[#F57C00]"></div>
      </div>

      {/* Círculos ambientales de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-[#D65F08]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        
        {/* SECCIÓN DE LOGOS */}
        <div className="mb-8 flex flex-col items-center gap-5 w-full">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:scale-105 transition-transform duration-300">
            <img src="/imju-elota.webp" alt="Logo IMJU Elota" className="w-40 h-24 object-contain" />
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
            <img src="/ayuntamiento-elota.webp" alt="H. Ayuntamiento de Elota" className="w-20 h-10 object-contain" />
            <div className="border-l border-slate-200 dark:border-slate-700 h-5"></div>
            <div className="text-left">
              <h2 className="text-[9px] font-black tracking-widest text-[#D65F08] dark:text-orange-400 uppercase">H. Ayuntamiento de Elota</h2>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">¡Unidos todo se puede!</p>
            </div>
          </div>
        </div>

        {/* TÍTULO Y BIENVENIDA */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-[#D65F08] dark:text-white tracking-tighter">
            Tarjeta <span className="text-[#F57C00]">Joven Elota</span>
          </h1>
          <div className="w-16 h-1.5 bg-[#F57C00] mx-auto mt-2.5 rounded-full"></div>
          <p className="text-slate-600 dark:text-slate-300 mt-4 text-sm font-medium leading-relaxed px-4">
            Tu acceso exclusivo a descuentos, oportunidades de empleo y beneficios en todo el municipio.
          </p>
        </div>

        {/* BOTONES DE ACCESO */}
        <div className="w-full space-y-4">
          
          <Link href="/login" className="flex items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-500/50 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-orange-50 dark:bg-orange-950/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10"></div>
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/40 text-[#F57C00] rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
              🪪
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Soy Joven</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Accede a tu tarjeta digital y beneficios.</p>
            </div>
            <span className="text-[#F57C00] font-black text-xl pr-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>

          <Link href="/login-negocio" className="flex items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-slate-700 hover:border-orange-100 dark:hover:border-orange-900/50 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-orange-50 dark:bg-orange-950/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10"></div>
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/40 text-[#D65F08] dark:text-orange-400 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
              🏪
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Soy Aliado</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Portal para comercios y empresas.</p>
            </div>
            <span className="text-[#D65F08] dark:text-orange-400 font-black text-xl pr-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>

        </div>

        {/* PIE DE PÁGINA */}
        <footer className="mt-12 text-center w-full border-t border-slate-200/60 dark:border-slate-800 pt-6 flex flex-col items-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">La Cruz, Elota, Sinaloa</p>
          <div className="flex justify-center flex-wrap gap-2 mb-5">
            <Link href="/panel-imju-elota" className="px-4 py-2 bg-[#D65F08] text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#B94E05] transition-colors shadow-sm">
              Administración
            </Link>
            <a href="https://www.facebook.com/profile.php?id=100075974077385" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
              Facebook
            </a>
          </div>
          
          <Link href="/aviso-de-privacidad" className="text-[10px] font-bold text-slate-400 hover:text-[#D65F08] transition-colors underline decoration-slate-300 underline-offset-4">
             Aviso de Privacidad
          </Link>
        </footer>

      </div>
    </main>
  );
}
