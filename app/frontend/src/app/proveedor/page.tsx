"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import { CuentasDelLocal } from "@/components/CuentasDelLocal";
import { Aviso, Panel } from "@/components/Panel";
import {
  api,
  dinero,
  type Fidelidad,
  hora,
  type Orden,
  type PanelLocal,
  patch,
  type PlatoLocal,
  post,
  put,
  type Usuario,
} from "@/lib/api";
import { C } from "@/lib/tokens";

type Pestaña = "panel" | "pedidos" | "menu" | "sellos" | "local" | "cuentas";

const PESTAÑAS: { id: Pestaña; texto: string }[] = [
  { id: "panel", texto: "Panel en vivo" },
  { id: "pedidos", texto: "Pedidos de hoy" },
  { id: "menu", texto: "Menú y cupos" },
  { id: "sellos", texto: "Tarjeta de sellos" },
  { id: "local", texto: "Horario" },
  { id: "cuentas", texto: "Cuentas" },
];

export default function PaginaProveedor() {
  return (
    <Panel rol="ADMINISTRADOR" ancho="max-w-6xl">
      {(u) => <Gerente yo={u} />}
    </Panel>
  );
}

function Gerente({ yo }: { yo: Usuario }) {
  const [pestaña, setPestaña] = useState<Pestaña>("panel");
  return (
    <div className="flex flex-col gap-5">
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Secciones">
        {PESTAÑAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestaña(p.id)}
            aria-current={pestaña === p.id ? "page" : undefined}
            className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap"
            style={
              pestaña === p.id
                ? { background: C.navy, color: "#FFFFFF" }
                : { background: C.card, color: C.navy, border: `1px solid ${C.border}` }
            }
          >
            {p.texto}
          </button>
        ))}
      </nav>
      {pestaña === "panel" && <PanelEnVivo />}
      {pestaña === "pedidos" && <PedidosDeHoy />}
      {pestaña === "menu" && <MenuYCupos />}
      {pestaña === "sellos" && <TarjetaDeSellos />}
      {pestaña === "local" && <Horario />}
      {pestaña === "cuentas" && <CuentasDelLocal yo={yo} />}
    </div>
  );
}

function Caja({ titulo, children, accion }: { titulo?: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <section className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      {(titulo || accion) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {titulo && (
            <h2 className="font-semibold" style={{ color: C.navy }}>
              {titulo}
            </h2>
          )}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

// ── Panel en vivo ───────────────────────────────────────────────────────────

/**
 * La analítica en vivo que pidió Negocios, dentro de lo que el acta define:
 * ventas del día, demanda por hora, cupo por plato con alertas (RF-17) y
 * ventas perdidas por agotado (RF-18). Se actualiza sola cada 10 segundos.
 */
function PanelEnVivo() {
  const [p, setP] = useState<PanelLocal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const leer = () =>
      api<PanelLocal>("/proveedor/panel")
        .then((d) => {
          setP(d);
          setError(null);
        })
        .catch((e) => setError(e.message));
    leer();
    const t = setInterval(leer, 10000);
    return () => clearInterval(t);
  }, []);

  if (!p) return error ? <Aviso texto={error} /> : <p style={{ color: C.textSec }}>Cargando…</p>;

  const maxHora = Math.max(1, ...p.por_hora.map((h) => h.ordenes));
  const alertas = p.platos.filter((x) => x.alerta);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold" style={{ color: C.navy }}>
          Hoy en tu local
        </h1>
        <span className="flex items-center gap-2 text-sm" style={{ color: C.textSec }}>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: C.green }} />
          En vivo · actualizado {p.actualizado}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi etiqueta="Ventas del día" valor={dinero(p.ventas)} nota="Cobradas por adelantado" destacado />
        <Kpi etiqueta="Pedidos" valor={String(p.ordenes)} nota={p.hora_pico !== null ? `Hora pico: ${p.hora_pico}:00` : "Sin pedidos aún"} />
        <Kpi etiqueta="Por retirar" valor={String(p.por_retirar)} nota={`${p.entregadas} entregados`} />
        <Kpi etiqueta="Recargas del día" valor={dinero(p.recargas)} nota="Directo a tu cuenta" />
      </div>

      {alertas.length > 0 && (
        <div className="flex flex-col gap-2">
          {alertas.map((a) => (
            <p
              key={a.id}
              className="rounded-xl px-4 py-2.5 text-sm font-medium"
              style={a.alerta === "Agotado" ? { background: C.errorBg, color: C.errorText } : { background: C.warnBg, color: C.warnText }}
            >
              {a.alerta === "Agotado" ? "⛔" : "⚠️"} {a.emoji} {a.nombre}:{" "}
              {a.alerta === "Agotado" ? "agotado para Aliflow" : `quedan ${a.cupo_restante} del cupo`}
              {a.perdidas_por_agotado > 0 && ` · ${a.perdidas_por_agotado} ventas perdidas`}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Caja titulo="Pedidos por hora">
          {p.por_hora.length === 0 ? (
            <p className="text-sm" style={{ color: C.textSec }}>
              Los pedidos de hoy aparecerán aquí a medida que lleguen.
            </p>
          ) : (
            <div className="flex h-44 items-end gap-2" role="img" aria-label="Pedidos por hora del día">
              {p.por_hora.map((h) => (
                <div key={h.hora} className="flex flex-1 flex-col items-center gap-1">
                  <span className="cifras text-xs font-semibold" style={{ color: C.navy }}>
                    {h.ordenes}
                  </span>
                  <div
                    className="w-full rounded-t-lg"
                    style={{
                      height: `${(h.ordenes / maxHora) * 120}px`,
                      background: h.hora === p.hora_pico ? C.green : C.mint,
                    }}
                  />
                  <span className="cifras text-xs" style={{ color: C.textSec }}>
                    {h.hora}:00
                  </span>
                </div>
              ))}
            </div>
          )}
        </Caja>

        <Caja titulo="Cupo de hoy por plato">
          <ul className="flex flex-col gap-3">
            {p.platos.map((x) => {
              const usado = x.cupo_asignado ? (x.cupo_asignado - x.cupo_restante) / x.cupo_asignado : 1;
              return (
                <li key={x.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span style={{ color: C.text }}>
                      {x.emoji} {x.nombre}
                    </span>
                    <span className="cifras" style={{ color: C.textSec }}>
                      {x.vendidos} vendidos · quedan {Math.max(0, x.cupo_restante)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full" style={{ background: C.sunken }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, usado * 100)}%`,
                        background: x.alerta === "Agotado" ? C.errorText : x.alerta ? C.amber : C.green,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Caja>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi etiqueta="Ventas perdidas por agotado" valor={String(p.rechazos_por_cupo)} nota="Sube el cupo si se repite" />
        <Kpi etiqueta="Rechazos por saldo" valor={String(p.rechazos_por_saldo)} nota="El estudiante debía recargar" />
        <Kpi etiqueta="Premios canjeados" valor={String(p.canjes)} nota={`Costo: ${dinero(p.costo_premios)}`} />
        <Kpi etiqueta="Pedidos vencidos" valor={String(p.vencidas)} nota="No retirados a tiempo" />
      </div>
    </div>
  );
}

function Kpi({ etiqueta, valor, nota, destacado }: { etiqueta: string; valor: string; nota: string; destacado?: boolean }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={destacado ? { background: C.navy, color: "#FFFFFF" } : { background: C.card, border: `1px solid ${C.border}` }}
    >
      <p className="text-xs font-medium" style={{ color: destacado ? "rgba(255,255,255,0.75)" : C.textSec }}>
        {etiqueta}
      </p>
      <p className="cifras text-2xl font-bold" style={{ color: destacado ? "#FFFFFF" : C.navy, fontFamily: "var(--font-poppins)" }}>
        {valor}
      </p>
      <p className="text-xs" style={{ color: destacado ? C.mint : C.textMuted }}>
        {nota}
      </p>
    </div>
  );
}

// ── Pedidos de hoy ──────────────────────────────────────────────────────────

function PedidosDeHoy() {
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null);
  useEffect(() => {
    const leer = () => api<Orden[]>("/proveedor/ordenes").then(setOrdenes);
    leer();
    const t = setInterval(leer, 10000);
    return () => clearInterval(t);
  }, []);
  if (!ordenes) return <p style={{ color: C.textSec }}>Cargando…</p>;
  const estilo: Record<Orden["estado"], { texto: string; bg: string; color: string }> = {
    COMPRADO: { texto: "Por retirar", bg: C.warnBg, color: C.warnText },
    ENTREGADO: { texto: "Entregado", bg: C.mint, color: C.greenText },
    EXPIRADO: { texto: "Vencido", bg: C.sunken, color: C.textSec },
  };
  return (
    <Caja titulo={`Pedidos de hoy (${ordenes.length})`}>
      {ordenes.length === 0 ? (
        <p className="text-sm" style={{ color: C.textSec }}>
          Todavía no hay pedidos hoy.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead style={{ color: C.textSec }}>
              <tr>
                <th className="py-2 pr-3 font-medium">Pedido</th>
                <th className="py-2 pr-3 font-medium">Hora</th>
                <th className="py-2 pr-3 font-medium">Estudiante</th>
                <th className="py-2 pr-3 font-medium">Platos</th>
                <th className="py-2 pr-3 font-medium">Total</th>
                <th className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id} style={{ borderTop: `1px solid ${C.border}`, color: C.text }}>
                  <td className="cifras py-2.5 pr-3 font-medium">{o.numero}</td>
                  <td className="cifras py-2.5 pr-3">{hora(o.fecha_hora)}</td>
                  <td className="py-2.5 pr-3">{o.estudiante}</td>
                  <td className="py-2.5 pr-3">
                    {o.lineas.map((l) => `${l.cantidad} × ${l.plato}`).join(", ")}
                    {o.es_canje && " ⭐ Premio"}
                  </td>
                  <td className="cifras py-2.5 pr-3">{o.es_canje ? `${dinero(o.subtotal)} − 100%` : dinero(o.total)}</td>
                  <td className="py-2.5">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: estilo[o.estado].bg, color: estilo[o.estado].color }}
                    >
                      {estilo[o.estado].texto}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Caja>
  );
}

// ── Menú y cupos (RF-13, RF-16) ─────────────────────────────────────────────

function MenuYCupos() {
  const [platos, setPlatos] = useState<PlatoLocal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    api<PlatoLocal[]>("/proveedor/platos").then(setPlatos);
  }, [version]);

  async function ejecutar(accion: () => Promise<unknown>) {
    setError(null);
    try {
      await accion();
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }

  function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    ejecutar(async () => {
      await post("/proveedor/platos", {
        nombre: f.get("nombre"),
        descripcion: f.get("descripcion") || null,
        precio: Number(f.get("precio")).toFixed(2),
        emoji: f.get("emoji") || null,
      });
      form.reset();
    });
  }

  if (!platos) return <p style={{ color: C.textSec }}>Cargando…</p>;
  const campo = { border: `1px solid ${C.borderStrong}` };

  return (
    <div className="flex flex-col gap-4">
      <Aviso texto={error} />
      <Caja titulo="Menú y cupo de hoy para Aliflow">
        <p className="mb-3 text-sm" style={{ color: C.textSec }}>
          El <strong>cupo</strong> son las unidades que apartas solo para Aliflow; nunca se vende más de eso. El{" "}
          <strong>stock del ERP</strong> es lo que reporta tu sistema y se muestra aparte, como referencia.
        </p>
        <ul className="flex flex-col divide-y" style={{ borderColor: C.border }}>
          {platos.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-3" style={{ borderColor: C.border, opacity: p.activo ? 1 : 0.55 }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl" style={{ background: C.mint }}>
                {p.emoji ?? "🍽️"}
              </span>
              <div className="min-w-40 flex-1">
                <p className="font-semibold" style={{ color: C.text }}>
                  {p.nombre} <span className="cifras font-normal" style={{ color: C.textSec }}>· {dinero(p.precio)}</span>
                </p>
                <p className="text-xs" style={{ color: C.textMuted }}>
                  Stock ERP: {p.stock_erp} · Vendidos hoy por Aliflow: {p.cupo_vendido}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: C.textSec }}>
                  Cupo
                </span>
                <button
                  onClick={() => ejecutar(() => put(`/proveedor/platos/${p.id}/cupo`, { cupo_asignado: Math.max(0, p.cupo_asignado - 1) }))}
                  className="h-8 w-8 rounded-full font-bold"
                  style={{ background: C.sunken, color: C.navy }}
                  aria-label={`Bajar cupo de ${p.nombre}`}
                >
                  −
                </button>
                <span className="cifras w-8 text-center font-semibold" style={{ color: C.navy }}>
                  {p.cupo_asignado}
                </span>
                <button
                  onClick={() => ejecutar(() => put(`/proveedor/platos/${p.id}/cupo`, { cupo_asignado: p.cupo_asignado + 1 }))}
                  className="h-8 w-8 rounded-full font-bold"
                  style={{ background: C.mint, color: C.navy }}
                  aria-label={`Subir cupo de ${p.nombre}`}
                >
                  +
                </button>
                <button
                  onClick={() => ejecutar(() => put(`/proveedor/platos/${p.id}/cupo`, { cupo_asignado: p.cupo_asignado + 10 }))}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: C.mint, color: C.navy }}
                >
                  +10
                </button>
              </div>
              <button
                onClick={() => ejecutar(() => patch(`/proveedor/platos/${p.id}`, { activo: !p.activo }))}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={p.activo ? { background: C.mint, color: C.greenText } : { background: C.sunken, color: C.textSec }}
              >
                {p.activo ? "Publicado" : "Oculto"}
              </button>
            </li>
          ))}
        </ul>
      </Caja>
      <Caja titulo="Nuevo plato">
        <form onSubmit={crear} className="grid gap-3 sm:grid-cols-6">
          <input name="emoji" placeholder="🍽️" maxLength={4} className="rounded-xl px-3 py-2 text-center sm:col-span-1" style={campo} aria-label="Ícono" />
          <input name="nombre" required placeholder="Nombre del plato" className="rounded-xl px-3 py-2 sm:col-span-3" style={campo} />
          <input name="precio" required type="number" step="0.01" min="0.01" placeholder="Precio" className="rounded-xl px-3 py-2 sm:col-span-2" style={campo} />
          <input name="descripcion" placeholder="Descripción (opcional)" className="rounded-xl px-3 py-2 sm:col-span-6" style={campo} />
          <button type="submit" className="rounded-xl py-2.5 font-semibold text-white sm:col-span-6" style={{ background: C.navy }}>
            Agregar al menú
          </button>
        </form>
      </Caja>
    </div>
  );
}

// ── Tarjeta de sellos (RF-32) ───────────────────────────────────────────────

function TarjetaDeSellos() {
  const [f, setF] = useState<Fidelidad | null>(null);
  const [cargado, setCargado] = useState(false);
  const [mensaje, setMensaje] = useState<{ t: string; tipo: "ok" | "error" } | null>(null);

  useEffect(() => {
    api<Fidelidad | null>("/proveedor/fidelidad").then((d) => {
      setF(
        d ?? { activo: true, sellos_requeridos: 8, descripcion_premio: "", max_sellos_por_dia: 1, vigencia_cartilla_dias: 90 },
      );
      setCargado(true);
    });
  }, []);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!f) return;
    try {
      await put("/proveedor/fidelidad", f);
      setMensaje({ t: "Guardado. Los cambios aplican a las próximas entregas.", tipo: "ok" });
    } catch (err) {
      setMensaje({ t: err instanceof Error ? err.message : "No se pudo guardar", tipo: "error" });
    }
  }

  if (!cargado || !f) return <p style={{ color: C.textSec }}>Cargando…</p>;
  const campo = { border: `1px solid ${C.borderStrong}` };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Caja titulo="Tu tarjeta de sellos">
        <form onSubmit={guardar} className="flex flex-col gap-3 text-sm">
          <label className="flex items-center gap-2 font-medium" style={{ color: C.text }}>
            <input type="checkbox" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} />
            Programa activo
          </label>
          <label className="flex flex-col gap-1" style={{ color: C.text }}>
            Sellos para ganar el premio
            <input type="number" min={1} max={50} value={f.sellos_requeridos} onChange={(e) => setF({ ...f, sellos_requeridos: Number(e.target.value) })} className="rounded-xl px-3 py-2" style={campo} />
          </label>
          <label className="flex flex-col gap-1" style={{ color: C.text }}>
            Premio
            <input required value={f.descripcion_premio} onChange={(e) => setF({ ...f, descripcion_premio: e.target.value })} className="rounded-xl px-3 py-2" style={campo} />
          </label>
          <label className="flex flex-col gap-1" style={{ color: C.text }}>
            Máximo de sellos por día
            <input type="number" min={1} max={10} value={f.max_sellos_por_dia} onChange={(e) => setF({ ...f, max_sellos_por_dia: Number(e.target.value) })} className="rounded-xl px-3 py-2" style={campo} />
          </label>
          <label className="flex flex-col gap-1" style={{ color: C.text }}>
            La tarjeta vence a los (días, vacío = no vence)
            <input
              type="number"
              min={1}
              value={f.vigencia_cartilla_dias ?? ""}
              onChange={(e) => setF({ ...f, vigencia_cartilla_dias: e.target.value ? Number(e.target.value) : null })}
              className="rounded-xl px-3 py-2"
              style={campo}
            />
          </label>
          {mensaje && <Aviso tipo={mensaje.tipo} texto={mensaje.t} />}
          <button type="submit" className="rounded-xl py-2.5 font-semibold text-white" style={{ background: C.navy }}>
            Guardar
          </button>
        </form>
      </Caja>
      <Caja titulo="Así la ve el estudiante">
        <div className="rounded-2xl p-4 text-white" style={{ background: C.navy }}>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: Math.min(f.sellos_requeridos, 20) }, (_, i) => (
              <span
                key={i}
                className="flex aspect-square items-center justify-center rounded-full text-sm font-bold"
                style={i < 2 ? { background: C.green, color: C.navyDeep } : { border: "2px dashed rgba(255,255,255,0.35)" }}
              >
                {i < 2 ? "✓" : i + 1}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm">Premio: {f.descripcion_premio || "—"}</p>
        </div>
        <p className="mt-3 text-sm" style={{ color: C.textSec }}>
          El sello se da al entregar el pedido, no al pagarlo. El premio se canjea como una orden con descuento del
          100%, así ves cuánto te cuestan los premios en el panel.
        </p>
      </Caja>
    </div>
  );
}

// ── Horario (RN-05) ─────────────────────────────────────────────────────────

function Horario() {
  const [horaMax, setHoraMax] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ t: string; tipo: "ok" | "error" } | null>(null);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    api<{ nombre: string; hora_maxima_retiro: string }>("/proveedor/local").then((l) => {
      setHoraMax(l.hora_maxima_retiro);
      setNombre(l.nombre);
    });
  }, []);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    try {
      await patch("/proveedor/local", { hora_maxima_retiro: horaMax });
      setMensaje({ t: "Guardado. Aplica a los pedidos nuevos; los ya pagados conservan su hora.", tipo: "ok" });
    } catch (err) {
      setMensaje({ t: err instanceof Error ? err.message : "No se pudo guardar", tipo: "error" });
    }
  }

  if (horaMax === null) return <p style={{ color: C.textSec }}>Cargando…</p>;
  return (
    <div className="max-w-md">
      <Caja titulo={`Horario de ${nombre}`}>
        <form onSubmit={guardar} className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1" style={{ color: C.text }}>
            Hora máxima de retiro
            <input
              type="time"
              value={horaMax}
              onChange={(e) => setHoraMax(e.target.value)}
              className="cifras rounded-xl px-3 py-2 text-lg"
              style={{ border: `1px solid ${C.borderStrong}` }}
            />
          </label>
          <p style={{ color: C.textSec }}>
            Hasta esta hora se reciben pedidos y se pueden retirar. Lo que no se retire a tiempo vence: el código vale
            solo el día de la compra.
          </p>
          {mensaje && <Aviso tipo={mensaje.tipo} texto={mensaje.t} />}
          <button type="submit" className="rounded-xl py-2.5 font-semibold text-white" style={{ background: C.navy }}>
            Guardar
          </button>
        </form>
      </Caja>
    </div>
  );
}
