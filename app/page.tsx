"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, authPersistenceReady, db } from "../firebase";

export default function Inicio() {
  const router = useRouter();
  const [revisando, setRevisando] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    authPersistenceReady.then(() => {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) { setRevisando(false); return; }
        try {
          const [youth, business] = await Promise.all([
            getDoc(doc(db, "jovenes", user.uid)),
            getDoc(doc(db, "negocios", user.uid)),
          ]);
          if (youth.exists()) router.replace("/tarjeta");
          else if (business.exists()) router.replace("/portal-negocios");
          else setRevisando(false);
        } catch {
          setRevisando(false);
        }
      });
    });
    return () => unsubscribe();
  }, [router]);

  if (revisando) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080d18] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-400"></div>
          <p className="text-[10px] font-black uppercase tracking-[.3em] text-slate-400">Preparando tu experiencia</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d18] font-sans text-white selection:bg-orange-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(245,124,0,.22),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(36,181,214,.17),transparent_28%),radial-gradient(circle_at_55%_90%,rgba(247,4,118,.12),transparent_35%)]"></div>
      <div className="brand-orb absolute -left-24 top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl"></div>
      <div className="brand-orb brand-orb-delay absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"></div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 md:px-10 md:py-9">
        <header className="brand-header-card brand-header-dark motion-enter flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="brand-logo-stage">
              <img src="/imju-elota.webp" alt="IMJU Elota" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.28em] text-orange-300">IMJU Elota</p>
              <p className="text-sm font-black tracking-tight">Tarjeta Joven</p>
            </div>
          </div>
          <Link href="/directorio" className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-200 transition hover:bg-white/10">Explorar aliados</Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.08fr_.92fr] lg:py-16">
          <section className="motion-enter-delay-1 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-[9px] font-black uppercase tracking-[.2em] text-orange-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400"></span>
              Beneficios que se viven
            </div>
            <h1 className="display-type text-5xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl md:text-7xl">
              Tu ciudad.<br />
              Tus beneficios.<br />
              <span className="bg-gradient-to-r from-orange-400 via-yellow-300 to-pink-400 bg-clip-text text-transparent">Tu siguiente nivel.</span>
            </h1>
            <p className="mt-7 max-w-xl text-sm font-medium leading-7 text-slate-300 md:text-base">Descubre promociones, oportunidades y negocios de Elota mientras haces crecer tu tarjeta con cada visita.</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                ["01", "Regístrate"], ["02", "Activa tu QR"], ["03", "Suma experiencias"],
              ].map(([number, label]) => (
                <div key={number} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3">
                  <span className="text-[9px] font-black text-orange-300">{number}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="motion-enter-delay-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/login" className="interactive-card shine-sweep group relative overflow-hidden rounded-[2.3rem] border border-orange-300/20 bg-gradient-to-br from-orange-500 to-[#d95309] p-6 shadow-2xl shadow-orange-950/20 hover:shadow-orange-500/20 active:scale-[.98]">
              <div className="brand-swarm" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-300/30 blur-2xl transition group-hover:scale-125"></div>
              <div className="relative flex items-center justify-between gap-5">
                <div>
                  <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl ring-1 ring-white/20">🪪</span>
                  <p className="mt-6 text-[9px] font-black uppercase tracking-[.25em] text-orange-100">Experiencia joven</p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight">Mi tarjeta</h2>
                  <p className="mt-2 max-w-xs text-xs font-medium leading-5 text-orange-50/80">Entra, muestra tu QR, completa misiones y desbloquea nuevos niveles.</p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-xl font-black text-orange-600 transition group-hover:translate-x-1">→</span>
              </div>
            </Link>

            <Link href="/login-negocio" className="interactive-card shine-sweep group relative overflow-hidden rounded-[2.3rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-500 to-teal-700 p-6 shadow-2xl shadow-emerald-950/20 hover:shadow-emerald-500/20 active:scale-[.98]">
              <div className="brand-swarm" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
              <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl transition group-hover:scale-125"></div>
              <div className="relative flex items-center justify-between gap-5">
                <div>
                  <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/20">🏪</span>
                  <p className="mt-6 text-[9px] font-black uppercase tracking-[.25em] text-emerald-100">Comunidad aliada</p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight">Mi negocio</h2>
                  <p className="mt-2 max-w-xs text-xs font-medium leading-5 text-emerald-50/80">Valida tarjetas, crea beneficios y mide el impacto de cada campaña.</p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-xl font-black text-emerald-700 transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          </section>
        </div>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-5 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <img src="/ayuntamiento-elota.webp" alt="H. Ayuntamiento de Elota" className="h-9 w-20 rounded-lg bg-white object-contain p-1" />
            <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-300">La Cruz, Elota</p><p className="text-[9px] text-slate-500">Av. Gabriel Leyva S/N, Centro</p></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <a href="https://www.facebook.com/profile.php?id=100075974077385" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/5 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10">Facebook</a>
            <Link href="/aviso-de-privacidad" className="rounded-full bg-white/5 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10">Privacidad</Link>
            <Link href="/panel-imju-elota" className="rounded-full bg-white/5 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10">Administración</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
