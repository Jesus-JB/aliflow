"use client";

import { type FormEvent, useEffect, useState } from "react";

import { Panel } from "@/components/Panel";
import {
  api,
  type Cuenta,
  type CuentaCreada,
  NOMBRE_ROL,
  post,
  type PuntoEntrega,
  type Usuario,
} from "@/lib/api";
import { C } from "@/lib/tokens";

export default function PaginaProveedor() {
  return <Panel rol="ADMINISTRADOR">{(u) => <CuentasDelLocal yo={u} />}</Panel>;
}

/** RF-04: crear, revocar y restablecer las cuentas del propio local. */
function CuentasDelLocal({ yo }: { yo: Usuario }) {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [puntos, setPuntos] = useState<PuntoEntrega[]>([]);
  const [rolNuevo, setRolNuevo] = useState<"PROVEEDOR" | "OPERADOR">("OPERADOR");
  const [clave, setClave] = useState<CuentaCreada | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cada cambio sube la versión y el efecto vuelve a leer del backend.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    Promise.all([
      api<Cuenta[]>("/proveedor/cuentas"),
      api<PuntoEntrega[]>("/proveedor/puntos-entrega"),
    ])
      .then(([c, p]) => {
        if (!vigente) return;
        setCuentas(c);
        setPuntos(p);
      })
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [version]);

  async function ejecutar(accion: () => Promise<unknown>) {
    setError(null);
    try {
      await accion();
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción");
    }
  }

  function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    ejecutar(async () => {
      const creada = await post<CuentaCreada>("/proveedor/cuentas", {
        nombre: f.get("nombre"),
        email: f.get("email"),
        rol: rolNuevo,
        punto_entrega_id: rolNuevo === "OPERADOR" ? f.get("punto") : null,
      });
      setClave(creada);
      form.reset();
    });
  }

  const nombrePunto = (id: string | null) => puntos.find((p) => p.id === id)?.nombre ?? "—";
  const tarjeta = { background: C.card, border: `1px solid ${C.border}` };
  const campo = { border: `1px solid ${C.borderStrong}` };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold" style={{ color: C.text }}>
        Cuentas del local
      </h1>

      {error && (
        <p role="alert" className="rounded-md p-3 text-sm" style={{ background: C.errorBg, color: C.errorText }}>
          {error}
        </p>
      )}

      {clave && (
        <div className="rounded-md p-4 text-sm" style={{ background: C.infoBg, color: C.infoText }}>
          <p className="font-medium">Contraseña temporal de {clave.email}</p>
          <p className="my-2 font-mono text-base" style={{ color: C.text }}>
            {clave.password_temporal}
          </p>
          <p>Entrégala a la persona por un canal seguro. No se volverá a mostrar.</p>
          <button className="mt-2 underline" onClick={() => setClave(null)}>
            Entendido
          </button>
        </div>
      )}

      <section className="overflow-x-auto rounded-xl" style={tarjeta}>
        <table className="w-full text-left text-sm">
          <thead style={{ color: C.textSec }}>
            <tr>
              <th className="p-3 font-medium">Nombre</th>
              <th className="p-3 font-medium">Rol</th>
              <th className="p-3 font-medium">Punto de entrega</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.id} style={{ borderTop: `1px solid ${C.border}`, color: C.text }}>
                <td className="p-3">
                  <div>{c.nombre}</div>
                  <div className="text-xs" style={{ color: C.textSec }}>
                    {c.email}
                  </div>
                </td>
                <td className="p-3">{NOMBRE_ROL[c.rol]}</td>
                <td className="p-3">{c.rol === "OPERADOR" ? nombrePunto(c.punto_entrega_id) : "—"}</td>
                <td className="p-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={
                      c.activo
                        ? { background: C.successBg, color: C.successText }
                        : { background: C.sunken, color: C.textSec }
                    }
                  >
                    {c.activo ? "Activa" : "Revocada"}
                  </span>
                </td>
                <td className="whitespace-nowrap p-3 text-right">
                  <button
                    className="mr-3 underline"
                    style={{ color: C.infoText }}
                    onClick={() =>
                      ejecutar(async () =>
                        setClave(await post<CuentaCreada>(`/proveedor/cuentas/${c.id}/restablecer`)),
                      )
                    }
                  >
                    Restablecer clave
                  </button>
                  {c.activo && c.id !== yo.id && (
                    <button
                      className="underline"
                      style={{ color: C.errorText }}
                      onClick={() => ejecutar(() => post(`/proveedor/cuentas/${c.id}/revocar`))}
                    >
                      Revocar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl p-4" style={tarjeta}>
        <h2 className="mb-3 font-semibold" style={{ color: C.text }}>
          Nueva cuenta
        </h2>
        <form onSubmit={crear} className="grid gap-3 sm:grid-cols-2">
          <input name="nombre" required placeholder="Nombre completo" className="rounded-md px-3 py-2" style={campo} />
          <input name="email" type="email" required placeholder="Correo" className="rounded-md px-3 py-2" style={campo} />
          <select
            value={rolNuevo}
            onChange={(e) => setRolNuevo(e.target.value as "PROVEEDOR" | "OPERADOR")}
            className="rounded-md px-3 py-2"
            style={campo}
          >
            <option value="OPERADOR">Operador</option>
            <option value="PROVEEDOR">Proveedor (gerente)</option>
          </select>
          {rolNuevo === "OPERADOR" ? (
            <select name="punto" required className="rounded-md px-3 py-2" style={campo}>
              {puntos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="rounded-md py-2 font-medium text-white sm:col-span-2"
            style={{ background: C.brand }}
          >
            Crear cuenta
          </button>
        </form>
      </section>
    </div>
  );
}
