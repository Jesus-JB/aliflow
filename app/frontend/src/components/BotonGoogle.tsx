"use client";

import Script from "next/script";
import { useRef, useState } from "react";

import { C } from "@/lib/tokens";

type Credencial = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(opciones: {
            client_id: string;
            callback: (r: Credencial) => void;
            hd?: string;
            ux_mode?: "popup" | "redirect";
          }): void;
          renderButton(el: HTMLElement, opciones: Record<string, unknown>): void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const DOMINIO = process.env.NEXT_PUBLIC_DOMINIO_INSTITUCIONAL ?? "uees.edu.ec";

/**
 * Botón de "Acceder con Google" (Google Identity Services). Entrega un ID token
 * firmado por Google; el backend lo verifica y decide (RF-01 c3). El parámetro
 * `hd` solo sugiere el dominio en el selector de cuentas: no es un control.
 */
export function BotonGoogle({ onToken }: { onToken: (idToken: string) => void }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [cargado, setCargado] = useState(false);

  if (!CLIENT_ID) {
    return (
      <p className="rounded-md p-3 text-sm" style={{ background: C.warnBg, color: C.warnText }}>
        Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID. Ver app/README.md.
      </p>
    );
  }

  function iniciar() {
    if (!window.google || !contenedor.current) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (r) => onToken(r.credential),
      hd: DOMINIO,
      ux_mode: "popup",
    });
    window.google.accounts.id.renderButton(contenedor.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      locale: "es",
      width: 300,
    });
    setCargado(true);
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" onReady={iniciar} />
      <div ref={contenedor} className="flex min-h-11 justify-center">
        {!cargado && <span style={{ color: C.textMuted }}>Cargando Google…</span>}
      </div>
    </>
  );
}
