"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../firebase";

type Status = "verificando" | "listo" | "guardando" | "completado" | "invalido";

export default function ActivarCuenta() {
  const [status, setStatus] = useState<Status>("verificando");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mensaje, setMensaje] = useState("");

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = params?.get("oobCode") || "";
  const requestedDestination = params?.get("destino") || "login";
  const destino = ["login", "login-negocio", "panel-imju-elota"].includes(requestedDestination)
    ? requestedDestination
    : "login";

  useEffect(() => {
    if (!code) {
      queueMicrotask(() => {
        setMensaje("El enlace está incompleto. Solicita uno nuevo desde tu pantalla de acceso.");
        setStatus("invalido");
      });
      return;
    }

    verifyPasswordResetCode(auth, code)
      .then((email) => {
        setCorreo(email);
        setStatus("listo");
      })
      .catch(() => {
        setMensaje("Este enlace ya fue utilizado o caducó. Solicita uno nuevo para continuar.");
        setStatus("invalido");
      });
  }, [code]);

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setMensaje("Usa por lo menos 8 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    setMensaje("");
    setStatus("guardando");
    try {
      await confirmPasswordReset(auth, code, password);
      setStatus("completado");
    } catch {
      setMensaje("No fue posible guardar la contraseña. Solicita un enlace nuevo e inténtalo otra vez.");
      setStatus("invalido");
    }
  };

  const fuerza = Math.min(100, password.length * 10 + (/[A-Z]/.test(password) ? 10 : 0) + (/\d/.test(password) ? 10 : 0));

  return (
    <main className="app-shell motion-enter min-h-screen overflow-hidden bg-[#080d18] px-5 py-8 text-white sm:grid sm:place-items-center">
      <div className="brand-orb absolute -left-24 top-24 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl"></div>
      <div className="brand-orb brand-orb-delay absolute -right-28 bottom-10 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"></div>

      <section className="relative mx-auto grid w-full max-w-4xl overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[.07] shadow-2xl backdrop-blur-xl md:grid-cols-[.85fr_1.15fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-teal-500 via-teal-600 to-pink-600 p-10 md:flex md:flex-col md:justify-between">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-yellow-300/25 blur-3xl"></div>
          <div className="relative flex gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white p-2 shadow-xl"><img src="/imju-elota.webp" alt="IMJU Elota" className="h-full w-full object-contain" /></div>
            <div className="grid h-16 w-24 place-items-center rounded-2xl bg-white p-2 shadow-xl"><img src="/ayuntamiento-elota.webp" alt="Ayuntamiento de Elota" className="h-full w-full object-contain" /></div>
          </div>
          <div className="relative">
            <span className="text-5xl">🔐</span>
            <h1 className="mt-5 text-4xl font-black leading-none tracking-tight">Tu acceso.<br />Tu experiencia.</h1>
            <p className="mt-4 text-sm font-semibold leading-6 text-teal-50/85">Crea una contraseña segura y comienza a usar Tarjeta Joven Elota.</p>
          </div>
        </div>

        <div className="p-6 sm:p-10 md:p-12">
          <div className="mb-8 flex items-center justify-between gap-4 md:hidden">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-1.5"><img src="/imju-elota.webp" alt="IMJU Elota" className="h-full w-full object-contain" /></div>
            <div className="rounded-full border border-teal-300/20 bg-teal-400/10 px-4 py-2 text-[9px] font-black uppercase tracking-[.18em] text-teal-200">Activación segura</div>
          </div>

          {status === "verificando" && (
            <div className="grid min-h-72 place-items-center text-center">
              <div><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-teal-400"></div><p className="mt-5 text-xs font-extrabold text-slate-300">Verificando tu invitación…</p></div>
            </div>
          )}

          {(status === "listo" || status === "guardando") && (
            <form onSubmit={guardar}>
              <p className="text-[9px] font-black uppercase tracking-[.24em] text-teal-300">Un último paso</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Crea tu contraseña</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-300">Activarás el acceso para <strong className="text-white">{correo}</strong>.</p>

              <div className="mt-8 space-y-4">
                <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Nueva contraseña</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-bold text-white outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10" placeholder="Mínimo 8 caracteres" autoComplete="new-password" required /></label>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-all duration-500 ${fuerza >= 80 ? "bg-emerald-400" : fuerza >= 50 ? "bg-yellow-300" : "bg-teal-500"}`} style={{ width: `${fuerza}%` }}></div></div>
                <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmar contraseña</span><input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-bold text-white outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10" placeholder="Escríbela nuevamente" autoComplete="new-password" required /></label>
              </div>
              {mensaje && <p className="mt-4 rounded-2xl bg-red-400/10 px-4 py-3 text-xs font-bold text-red-200">{mensaje}</p>}
              <button type="submit" disabled={status === "guardando"} className="shine-sweep relative mt-7 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-pink-500 py-4 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-teal-950/30 transition active:scale-[.98] disabled:opacity-60">{status === "guardando" ? "Activando…" : "Activar mi cuenta"}</button>
              <p className="mt-4 text-center text-[10px] font-medium text-slate-500">No compartas tu contraseña ni este enlace.</p>
            </form>
          )}

          {status === "completado" && (
            <div className="grid min-h-80 place-items-center text-center">
              <div><div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-emerald-400 to-cyan-500 text-5xl shadow-xl shadow-emerald-950/30">✓</div><p className="mt-6 text-[9px] font-black uppercase tracking-[.25em] text-emerald-300">Acceso desbloqueado</p><h2 className="mt-2 text-3xl font-black">¡Todo listo!</h2><p className="mt-3 text-sm font-medium text-slate-300">Tu contraseña fue creada correctamente.</p><Link href={`/${destino}`} className="mt-7 inline-flex rounded-2xl bg-white px-7 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 transition hover:-translate-y-0.5">Entrar ahora →</Link></div>
            </div>
          )}

          {status === "invalido" && (
            <div className="grid min-h-80 place-items-center text-center">
              <div><div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.8rem] bg-red-400/10 text-4xl">⏳</div><h2 className="mt-6 text-2xl font-black">Necesitas un enlace nuevo</h2><p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-slate-300">{mensaje}</p><Link href={`/${destino}`} className="mt-7 inline-flex rounded-2xl bg-white px-7 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900">Volver al acceso</Link></div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
