"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { AliflowLogo } from "@/components/AliflowLogo";
import { api, NOMBRE_ROL, post, type Rol, type Usuario } from "@/lib/api";
import { C } from "@/lib/tokens";

/**
 * Marco de cada interfaz por rol. Si no hay sesión vuelve al inicio; si la
 * sesión es de otro rol, lo manda a su propia interfaz.
 */
export function Panel({
  rol,
  children,
}: {
  rol: Rol;
  children: (usuario: Usuario) => ReactNode;
}) {
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

  if (!usuario) {
    return (
      <main className="flex flex-1 items-center justify-center" style={{ color: C.textSec }}>
        Cargando…
      </main>
    );
  }

  const colorRol = rol === "SUPERADMIN" ? C.admin : C.brand;
  return (
    <div className="flex min-h-full flex-1 flex-col" style={{ background: C.pageBg }}>
      <header
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2">
          <AliflowLogo size={32} />
          <span className="font-semibold" style={{ color: C.text }}>
            Aliflow
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ color: colorRol, background: rol === "SUPERADMIN" ? C.adminBg : C.brandBg }}
          >
            {NOMBRE_ROL[rol]}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline" style={{ color: C.textSec }}>
            {usuario.nombre}
          </span>
          <button
            onClick={salir}
            className="rounded-md px-3 py-1.5 font-medium"
            style={{ color: C.text, border: `1px solid ${C.borderStrong}` }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children(usuario)}</main>
    </div>
  );
}

export function Pendiente({ titulo, sprint }: { titulo: string; sprint: number }) {
  return (
    <section
      className="rounded-xl p-6"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <h1 className="mb-2 text-xl font-semibold" style={{ color: C.text }}>
        {titulo}
      </h1>
      <p style={{ color: C.textSec }}>
        Ingresaste correctamente. Esta interfaz se construye en el sprint {sprint}.
      </p>
    </section>
  );
}
