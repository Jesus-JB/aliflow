"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { AliflowMarca } from "@/components/AliflowLogo";
import { api, NOMBRE_ROL, post, type Rol, type Usuario } from "@/lib/api";
import { C } from "@/lib/tokens";

/**
 * La sesión de la interfaz de un rol. Sin sesión vuelve al inicio; con la
 * sesión de otro rol, lo manda a su propia interfaz. El backend decide el
 * acceso de verdad: esto solo evita mostrar una pantalla que no le toca.
 */
export function useSesion(rol: Rol) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    api<Usuario>("/auth/me")
      .then((u) => (u.rol === rol ? setUsuario(u) : router.replace(u.destino)))
      .catch(() => router.replace("/"));
  }, [rol, router]);

  async function salir() {
    await post("/auth/logout").catch(() => undefined);
    router.replace("/");
  }

  return { usuario, salir };
}

export function Cargando() {
  return (
    <main className="flex flex-1 items-center justify-center" style={{ color: C.textSec }}>
      Cargando…
    </main>
  );
}

/** Marco de las interfaces de escritorio (Proveedor, Operador, Super-Admin). */
export function Panel({
  rol,
  ancho = "max-w-4xl",
  children,
}: {
  rol: Rol;
  ancho?: string;
  children: (usuario: Usuario) => ReactNode;
}) {
  const { usuario, salir } = useSesion(rol);
  if (!usuario) return <Cargando />;

  return (
    <div className="flex min-h-full flex-1 flex-col" style={{ background: C.pageBg }}>
      <header className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: C.navy }}>
        <div className="flex items-center gap-3">
          <AliflowMarca size={30} sobreOscuro />
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ color: C.navy, background: C.mint }}
          >
            {NOMBRE_ROL[rol]}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-white/80 sm:inline">{usuario.nombre}</span>
          <button
            onClick={salir}
            className="rounded-lg px-3 py-1.5 font-medium text-white"
            style={{ border: "1px solid rgba(255,255,255,0.35)" }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className={`mx-auto w-full ${ancho} flex-1 px-4 py-6`}>{children(usuario)}</main>
    </div>
  );
}

export function Pendiente({ titulo, sprint }: { titulo: string; sprint: number }) {
  return (
    <section className="rounded-2xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <h1 className="mb-2 text-xl font-semibold" style={{ color: C.text }}>
        {titulo}
      </h1>
      <p style={{ color: C.textSec }}>
        Ingresaste correctamente. Esta interfaz se construye en el sprint {sprint}.
      </p>
    </section>
  );
}

/** Mensaje de error de una acción, listo para mostrar. */
export function Aviso({ texto, tipo = "error" }: { texto: string | null; tipo?: "error" | "ok" | "info" }) {
  if (!texto) return null;
  const estilo = {
    error: { background: C.errorBg, color: C.errorText },
    ok: { background: C.successBg, color: C.successText },
    info: { background: C.infoBg, color: C.infoText },
  }[tipo];
  return (
    <p role={tipo === "error" ? "alert" : "status"} className="rounded-xl p-3 text-sm" style={estilo}>
      {texto}
    </p>
  );
}
