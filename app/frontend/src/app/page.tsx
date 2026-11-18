"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AliflowMarca } from "@/components/AliflowLogo";
import { BotonGoogle } from "@/components/BotonGoogle";
import { post, type Usuario } from "@/lib/api";
import { C } from "@/lib/tokens";

type Pestaña = "estudiante" | "personal";

const DEMO = process.env.NEXT_PUBLIC_ALIFLOW_DEMO === "1";

const PASOS = [
  { n: "1", titulo: "Explora", texto: "Mira el menú del día y lo que queda disponible." },
  { n: "2", titulo: "Paga con tu saldo", texto: "Recargas en tu local y pagas antes de salir de clase." },
  { n: "3", titulo: "Retira", texto: "Dicta tu código de 6 dígitos en el mostrador. Sin filas." },
];

export default function Ingreso() {
  const router = useRouter();
  const [pestaña, setPestaña] = useState<Pestaña>("estudiante");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(ruta: string, cuerpo?: unknown) {
    setError(null);
    setEnviando(true);
    try {
      const u = await post<Usuario>(ruta, cuerpo);
      router.replace(u.destino);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo ingresar");
      setEnviando(false);
    }
  }

  function enviarCredenciales(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    entrar("/auth/login", { email: f.get("email"), password: f.get("password") });
  }

  const estiloPestaña = (activa: boolean) => ({
    color: activa ? C.navy : C.textSec,
    borderBottom: `3px solid ${activa ? C.green : "transparent"}`,
  });

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      {/* La marca: esencia, eslogan y cómo funciona. */}
      <section
        className="relative flex flex-col justify-between gap-8 overflow-hidden px-6 py-8 text-white lg:w-1/2 lg:px-12 lg:py-12"
        style={{ background: C.navy }}
      >
        <div
          aria-hidden
          className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full"
          style={{ background: C.green, opacity: 0.18 }}
        />
        <AliflowMarca size={40} sobreOscuro />
        <div className="relative flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: C.mint }}>
            Tiempo para lo que importa
          </p>
          <h1 className="text-4xl leading-tight font-bold sm:text-5xl">
            Pide antes.
            <br />
            <span style={{ color: C.green }}>Sin filas.</span>
          </h1>
          <p className="max-w-md text-base text-white/80">
            Tu almuerzo del campus, pagado antes de salir de clase y listo para retirar. Los locales
            cobran por adelantado y ven su demanda en vivo.
          </p>
        </div>
        <ol className="relative grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {PASOS.map((p) => (
            <li key={p.n} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
              <span
                className="mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: C.green, color: C.navyDeep }}
              >
                {p.n}
              </span>
              <p className="font-semibold">{p.titulo}</p>
              <p className="text-sm text-white/75">{p.texto}</p>
            </li>
          ))}
        </ol>
        <p className="relative text-xs text-white/60">
          Nace en la UEES. Nuestra visión: ser el estándar del almuerzo universitario en Ecuador, con
          más locales y más campus.
        </p>
      </section>

      {/* El ingreso. */}
      <section
        className="flex flex-1 items-center justify-center px-4 py-10"
        style={{ background: C.pageBg }}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-6 shadow-sm"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <h2 className="mb-1 text-2xl font-semibold" style={{ color: C.navy }}>
            Ingresa
          </h2>
          <p className="mb-5 text-sm" style={{ color: C.textSec }}>
            ¿Qué vas a hacer hoy?
          </p>

          <div className="mb-5 grid grid-cols-2 text-sm font-semibold" role="tablist">
            <button
              role="tab"
              aria-selected={pestaña === "estudiante"}
              className="pb-2"
              style={estiloPestaña(pestaña === "estudiante")}
              onClick={() => setPestaña("estudiante")}
            >
              Soy estudiante
            </button>
            <button
              role="tab"
              aria-selected={pestaña === "personal"}
              className="pb-2"
              style={estiloPestaña(pestaña === "personal")}
              onClick={() => setPestaña("personal")}
            >
              Personal del local
            </button>
          </div>

          {pestaña === "estudiante" ? (
            <div className="flex flex-col gap-3">
              <p className="text-center text-sm" style={{ color: C.textSec }}>
                Ingresa con tu cuenta institucional de la UEES.
              </p>
              <BotonGoogle onToken={(t) => entrar("/auth/google", { id_token: t })} />
              {DEMO && (
                <>
                  <div className="my-1 flex items-center gap-3 text-xs" style={{ color: C.textMuted }}>
                    <span className="h-px flex-1" style={{ background: C.border }} />o
                    <span className="h-px flex-1" style={{ background: C.border }} />
                  </div>
                  <button
                    onClick={() => entrar("/auth/estudiante-demo")}
                    disabled={enviando}
                    className="rounded-xl py-3 font-semibold text-white disabled:opacity-60"
                    style={{ background: C.greenAction }}
                  >
                    Entrar como estudiante de demostración
                  </button>
                  <p className="text-center text-xs" style={{ color: C.textMuted }}>
                    Recorre la app completa con una cuenta de prueba. Los pagos son simulados.
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={enviarCredenciales} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: C.text }}>
                Correo
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  className="rounded-xl px-3 py-2.5 font-normal"
                  style={{ border: `1px solid ${C.borderStrong}` }}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium" style={{ color: C.text }}>
                Contraseña
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="rounded-xl px-3 py-2.5 font-normal"
                  style={{ border: `1px solid ${C.borderStrong}` }}
                />
              </label>
              <button
                type="submit"
                disabled={enviando}
                className="mt-1 rounded-xl py-3 font-semibold text-white disabled:opacity-60"
                style={{ background: C.brand }}
              >
                {enviando ? "Ingresando…" : "Ingresar"}
              </button>
            </form>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl p-3 text-sm"
              style={{ background: C.errorBg, color: C.errorText }}
            >
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
