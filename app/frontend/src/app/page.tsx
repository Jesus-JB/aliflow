"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AliflowLogo } from "@/components/AliflowLogo";
import { BotonGoogle } from "@/components/BotonGoogle";
import { post, type Usuario } from "@/lib/api";
import { C } from "@/lib/tokens";

type Pestaña = "estudiante" | "personal";

export default function Ingreso() {
  const router = useRouter();
  const [pestaña, setPestaña] = useState<Pestaña>("estudiante");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(ruta: string, cuerpo: unknown) {
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
    color: activa ? C.brandDeep : C.textSec,
    borderBottom: `2px solid ${activa ? C.brand : "transparent"}`,
  });

  return (
    <main
      className="flex flex-1 items-center justify-center px-4 py-10"
      style={{ background: C.pageBg }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-sm"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <AliflowLogo size={56} />
          <h1 className="text-2xl font-semibold" style={{ color: C.text }}>
            Aliflow
          </h1>
          <p className="text-sm" style={{ color: C.textSec }}>
            Pide tu almuerzo y retíralo sin hacer fila
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 text-sm font-medium" role="tablist">
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
          </div>
        ) : (
          <form onSubmit={enviarCredenciales} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm" style={{ color: C.text }}>
              Correo
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                className="rounded-md px-3 py-2"
                style={{ border: `1px solid ${C.borderStrong}` }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm" style={{ color: C.text }}>
              Contraseña
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="rounded-md px-3 py-2"
                style={{ border: `1px solid ${C.borderStrong}` }}
              />
            </label>
            <button
              type="submit"
              disabled={enviando}
              className="mt-1 rounded-md py-2.5 font-medium text-white disabled:opacity-60"
              style={{ background: C.brand }}
            >
              {enviando ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md p-3 text-sm"
            style={{ background: C.errorBg, color: C.errorText }}
          >
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
