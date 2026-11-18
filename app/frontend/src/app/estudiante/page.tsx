"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";

import { AliflowMarca } from "@/components/AliflowLogo";
import { Aviso, Cargando, useSesion } from "@/components/Panel";
import {
  api,
  codigoLegible,
  dinero,
  fecha,
  hora,
  type LocalDetalle,
  type LocalResumen,
  type Orden,
  type PlatoMenu,
  post,
  type Usuario,
} from "@/lib/api";
import { C } from "@/lib/tokens";

type Pestaña = "menu" | "pedidos" | "sellos" | "perfil";
type Pantalla =
  | { tipo: "plato"; plato: PlatoMenu }
  | { tipo: "recarga" }
  | { tipo: "codigo"; orden: Orden; saldo?: string }
  | { tipo: "canje" }
  | { tipo: "locales" }
  | null;

const CLAVE_LOCAL = "aliflow.local";

export default function AppEstudiante() {
  const { usuario, salir } = useSesion("ESTUDIANTE");
  if (!usuario) return <Cargando />;
  return <App usuario={usuario} salir={salir} />;
}

function App({ usuario, salir }: { usuario: Usuario; salir: () => void }) {
  const [locales, setLocales] = useState<LocalResumen[] | null>(null);
  const [localId, setLocalId] = useState<string | null>(null);
  const [local, setLocal] = useState<LocalDetalle | null>(null);
  const [pestaña, setPestaña] = useState<Pestaña>("menu");
  const [pantalla, setPantalla] = useState<Pantalla>(null);
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // RF-15: hay que elegir un local antes de ver menú o saldo, y la elección
  // se recuerda. Con un solo local activo (el piloto) se elige solo.
  useEffect(() => {
    api<LocalResumen[]>("/estudiante/locales").then((ls) => {
      setLocales(ls);
      let guardado: string | null = null;
      try {
        guardado = localStorage.getItem(CLAVE_LOCAL);
      } catch {
        /* sin almacenamiento: se vuelve a elegir */
      }
      const elegido = ls.find((l) => l.id === guardado) ?? (ls.length === 1 ? ls[0] : null);
      setLocalId(elegido?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!localId) return;
    let vigente = true;
    api<LocalDetalle>(`/estudiante/locales/${localId}`).then((d) => vigente && setLocal(d));
    return () => {
      vigente = false;
    };
  }, [localId, version]);

  function elegirLocal(id: string) {
    try {
      localStorage.setItem(CLAVE_LOCAL, id);
    } catch {
      /* se recuerda solo en esta sesión */
    }
    setLocal(null);
    setLocalId(id);
    setPantalla(null);
  }

  if (!locales) return <Cargando />;
  if (!localId || pantalla?.tipo === "locales") {
    return <ElegirLocal locales={locales} onElegir={elegirLocal} />;
  }
  if (!local) return <Cargando />;

  const cerrar = () => {
    setPantalla(null);
    recargar();
  };

  let contenido: ReactNode;
  if (pantalla?.tipo === "plato") {
    contenido = (
      <DetallePlato
        local={local}
        plato={pantalla.plato}
        onVolver={() => setPantalla(null)}
        onRecargar={() => setPantalla({ tipo: "recarga" })}
        onComprado={(orden, saldo) => setPantalla({ tipo: "codigo", orden, saldo })}
      />
    );
  } else if (pantalla?.tipo === "recarga") {
    contenido = <Recarga local={local} onVolver={cerrar} />;
  } else if (pantalla?.tipo === "codigo") {
    contenido = (
      <CodigoRetiro
        local={local}
        orden={pantalla.orden}
        saldo={pantalla.saldo}
        onPedidos={() => {
          setPestaña("pedidos");
          cerrar();
        }}
        onMenu={() => {
          setPestaña("menu");
          cerrar();
        }}
      />
    );
  } else if (pantalla?.tipo === "canje") {
    contenido = (
      <Canje
        local={local}
        onVolver={() => setPantalla(null)}
        onCanjeado={(orden) => setPantalla({ tipo: "codigo", orden })}
      />
    );
  } else {
    contenido = (
      <>
        <Encabezado
          local={local}
          variosLocales={locales.length > 1}
          onCambiarLocal={() => setPantalla({ tipo: "locales" })}
        />
        <div className="flex-1 px-4 pt-4 pb-28">
          {pestaña === "menu" && (
            <Menu
              local={local}
              onPlato={(plato) => setPantalla({ tipo: "plato", plato })}
              onRecargar={() => setPantalla({ tipo: "recarga" })}
            />
          )}
          {pestaña === "pedidos" && <Pedidos onCodigo={(orden) => setPantalla({ tipo: "codigo", orden })} />}
          {pestaña === "sellos" && <Sellos local={local} onCanjear={() => setPantalla({ tipo: "canje" })} />}
          {pestaña === "perfil" && <Perfil usuario={usuario} salir={salir} />}
        </div>
        <BarraPestañas activa={pestaña} onCambiar={setPestaña} />
      </>
    );
  }

  return (
    <div className="flex flex-1 justify-center" style={{ background: C.sunken }}>
      <div className="relative flex min-h-full w-full max-w-md flex-col" style={{ background: C.pageBg }}>
        {contenido}
      </div>
    </div>
  );
}

// ── Piezas comunes ──────────────────────────────────────────────────────────

function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{ background: C.card, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

function BotonPrincipal({
  children,
  onClick,
  disabled,
  verde = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  verde?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-50"
      style={{ background: verde ? C.greenAction : C.navy }}
    >
      {children}
    </button>
  );
}

function Volver({ onClick, titulo }: { onClick: () => void; titulo: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-4">
      <button
        onClick={onClick}
        aria-label="Volver"
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
        style={{ background: C.card, border: `1px solid ${C.border}`, color: C.navy }}
      >
        ←
      </button>
      <h1 className="text-lg font-semibold" style={{ color: C.navy }}>
        {titulo}
      </h1>
    </div>
  );
}

function Emoji({ e, tamaño = 48 }: { e: string | null; tamaño?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: tamaño, height: tamaño, background: C.mint, fontSize: tamaño * 0.55 }}
      aria-hidden
    >
      {e ?? "🍽️"}
    </span>
  );
}

function Etiqueta({ children, tono }: { children: ReactNode; tono: "verde" | "gris" | "ambar" | "navy" }) {
  const estilos = {
    verde: { background: C.mint, color: C.greenText },
    gris: { background: C.sunken, color: C.textSec },
    ambar: { background: C.warnBg, color: C.warnText },
    navy: { background: C.infoBg, color: C.navy },
  }[tono];
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap" style={estilos}>
      {children}
    </span>
  );
}

// ── Elegir local (RF-15) ────────────────────────────────────────────────────

function ElegirLocal({ locales, onElegir }: { locales: LocalResumen[]; onElegir: (id: string) => void }) {
  return (
    <div className="flex flex-1 justify-center" style={{ background: C.sunken }}>
      <div className="flex w-full max-w-md flex-col gap-4 p-5" style={{ background: C.pageBg }}>
        <AliflowMarca size={32} />
        <h1 className="text-2xl font-bold" style={{ color: C.navy }}>
          ¿Dónde almuerzas hoy?
        </h1>
        <p className="text-sm" style={{ color: C.textSec }}>
          Tu saldo y tu tarjeta de sellos son de cada local. Puedes cambiar de local cuando quieras.
        </p>
        {locales.map((l) => (
          <button key={l.id} onClick={() => onElegir(l.id)} className="text-left">
            <Tarjeta className="flex items-center justify-between">
              <div>
                <p className="font-semibold" style={{ color: C.text }}>
                  {l.nombre}
                </p>
                <p className="text-sm" style={{ color: C.textSec }}>
                  Retiro hasta las {l.hora_maxima_retiro}
                </p>
              </div>
              <span className="cifras font-semibold" style={{ color: C.greenText }}>
                {dinero(l.saldo)}
              </span>
            </Tarjeta>
          </button>
        ))}
      </div>
    </div>
  );
}

function Encabezado({
  local,
  variosLocales,
  onCambiarLocal,
}: {
  local: LocalDetalle;
  variosLocales: boolean;
  onCambiarLocal: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: C.navy }}>
      <AliflowMarca size={26} sobreOscuro />
      <button
        onClick={variosLocales ? onCambiarLocal : undefined}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
        style={{ background: C.mint, color: C.navy }}
      >
        📍 {local.nombre}
        {variosLocales && <span aria-hidden>▾</span>}
      </button>
    </header>
  );
}

function BarraPestañas({ activa, onCambiar }: { activa: Pestaña; onCambiar: (p: Pestaña) => void }) {
  const items: { id: Pestaña; icono: string; texto: string }[] = [
    { id: "menu", icono: "🍽️", texto: "Menú" },
    { id: "pedidos", icono: "🧾", texto: "Pedidos" },
    { id: "sellos", icono: "⭐", texto: "Sellos" },
    { id: "perfil", icono: "👤", texto: "Perfil" },
  ];
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-10 grid w-full max-w-md -translate-x-1/2 grid-cols-4 px-2 pt-2 pb-4"
      style={{ background: C.card, borderTop: `1px solid ${C.border}` }}
    >
      {items.map((i) => (
        <button
          key={i.id}
          onClick={() => onCambiar(i.id)}
          aria-current={activa === i.id ? "page" : undefined}
          className="flex flex-col items-center gap-0.5 rounded-xl py-1 text-xs font-semibold"
          style={{ color: activa === i.id ? C.navy : C.textMuted, background: activa === i.id ? C.mint : "transparent" }}
        >
          <span className="text-lg" aria-hidden>
            {i.icono}
          </span>
          {i.texto}
        </button>
      ))}
    </nav>
  );
}

// ── Menú ────────────────────────────────────────────────────────────────────

function TarjetaSaldo({ local, onRecargar }: { local: LocalDetalle; onRecargar: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 text-white" style={{ background: C.navy }}>
      <div aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full" style={{ background: C.green, opacity: 0.25 }} />
      <p className="text-sm text-white/75">Tu saldo en {local.nombre}</p>
      <p className="cifras text-4xl font-bold" style={{ fontFamily: "var(--font-poppins)" }}>
        {dinero(local.saldo)}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-white/70">Solo se usa en {local.nombre}. El dinero va directo al local.</p>
        <button
          onClick={onRecargar}
          className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: C.green, color: C.navyDeep }}
        >
          + Recargar
        </button>
      </div>
    </div>
  );
}

function Menu({
  local,
  onPlato,
  onRecargar,
}: {
  local: LocalDetalle;
  onPlato: (p: PlatoMenu) => void;
  onRecargar: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <TarjetaSaldo local={local} onRecargar={onRecargar} />
      {local.recibe_pedidos ? (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ background: C.mint, color: C.greenText }}>
          <span aria-hidden>⏱️</span>
          <span>
            Pide ahora y retíralo <strong>hoy hasta las {local.hora_maxima_retiro}</strong>.
          </span>
        </div>
      ) : (
        <Aviso
          tipo="info"
          texto={`${local.nombre} ya no recibe pedidos por hoy (hasta las ${local.hora_maxima_retiro}). Vuelve mañana.`}
        />
      )}
      <h2 className="text-lg font-semibold" style={{ color: C.navy }}>
        Menú de hoy
      </h2>
      <ul className="flex flex-col gap-3">
        {local.menu.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onPlato(p)}
              disabled={!p.disponible || !local.recibe_pedidos}
              className="w-full text-left disabled:cursor-not-allowed"
            >
              <Tarjeta className={`flex items-center gap-3 ${p.disponible ? "" : "opacity-60"}`}>
                <Emoji e={p.emoji} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold" style={{ color: C.text }}>
                      {p.nombre}
                    </p>
                    <span className="cifras font-semibold" style={{ color: C.navy }}>
                      {dinero(p.precio)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm" style={{ color: C.textSec }}>
                    {p.descripcion}
                  </p>
                  <div className="mt-1.5">
                    {p.disponible ? <Etiqueta tono="verde">Disponible</Etiqueta> : <Etiqueta tono="gris">Agotado</Etiqueta>}
                  </div>
                </div>
              </Tarjeta>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetallePlato({
  local,
  plato,
  onVolver,
  onRecargar,
  onComprado,
}: {
  local: LocalDetalle;
  plato: PlatoMenu;
  onVolver: () => void;
  onRecargar: () => void;
  onComprado: (orden: Orden, saldo: string) => void;
}) {
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const total = Number(plato.precio) * cantidad;
  const falta = total - Number(local.saldo);

  async function pagar() {
    setError(null);
    setEnviando(true);
    try {
      const r = await post<{ orden: Orden; saldo: string }>("/estudiante/ordenes", {
        proveedor_id: local.id,
        items: [{ plato_id: plato.id, cantidad }],
      });
      onComprado(r.orden, r.saldo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la compra");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Volver onClick={onVolver} titulo={local.nombre} />
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-col items-center gap-3 rounded-3xl py-8" style={{ background: C.mint }}>
          <span style={{ fontSize: 72 }} aria-hidden>
            {plato.emoji ?? "🍽️"}
          </span>
        </div>
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold" style={{ color: C.navy }}>
              {plato.nombre}
            </h1>
            <span className="cifras text-xl font-semibold" style={{ color: C.navy }}>
              {dinero(plato.precio)}
            </span>
          </div>
          <p className="mt-1" style={{ color: C.textSec }}>
            {plato.descripcion}
          </p>
        </div>
        <Tarjeta className="flex items-center justify-between">
          <span className="font-medium" style={{ color: C.text }}>
            Cantidad
          </span>
          <div className="flex items-center gap-4">
            {[
              { s: "−", d: -1, off: cantidad <= 1 },
              { s: "+", d: 1, off: cantidad >= 5 },
            ].map((b, i) => (
              <span key={b.s} className="contents">
                {i === 1 && (
                  <span className="cifras w-5 text-center text-lg font-semibold" style={{ color: C.text }}>
                    {cantidad}
                  </span>
                )}
                <button
                  onClick={() => setCantidad((c) => c + b.d)}
                  disabled={b.off}
                  aria-label={b.d > 0 ? "Agregar uno" : "Quitar uno"}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-semibold disabled:opacity-40"
                  style={{ background: C.mint, color: C.navy }}
                >
                  {b.s}
                </button>
              </span>
            ))}
          </div>
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-2 text-sm">
          <Fila etiqueta="Total" valor={dinero(total)} fuerte />
          <Fila etiqueta={`Saldo en ${local.nombre}`} valor={dinero(local.saldo)} />
          <Fila etiqueta="Retiro" valor={`Hoy hasta las ${local.hora_maxima_retiro}`} />
        </Tarjeta>
        <Aviso texto={error} />
        <div className="mt-auto flex flex-col gap-2">
          {falta > 0 ? (
            <>
              <Aviso tipo="info" texto={`Te faltan ${dinero(falta)} en tu saldo de ${local.nombre}.`} />
              <BotonPrincipal verde onClick={onRecargar}>
                Recargar en {local.nombre}
              </BotonPrincipal>
            </>
          ) : (
            <BotonPrincipal onClick={pagar} disabled={enviando}>
              {enviando ? "Pagando…" : `Pagar con saldo de ${local.nombre} · ${dinero(total)}`}
            </BotonPrincipal>
          )}
        </div>
      </div>
    </div>
  );
}

function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span style={{ color: C.textSec }}>{etiqueta}</span>
      <span className={`cifras ${fuerte ? "font-semibold" : ""}`} style={{ color: C.text }}>
        {valor}
      </span>
    </div>
  );
}

// ── Recarga (RF-08) ─────────────────────────────────────────────────────────

function Recarga({ local, onVolver }: { local: LocalDetalle; onVolver: () => void }) {
  const [monto, setMonto] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [hecha, setHecha] = useState<{ monto: string; saldo: string; numero_operacion: string } | null>(null);

  async function confirmar() {
    setError(null);
    setEnviando(true);
    try {
      setHecha(await post(`/estudiante/locales/${local.id}/recargas`, { monto: Number(monto).toFixed(2) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo recargar");
    } finally {
      setEnviando(false);
    }
  }

  if (hecha) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: C.mint }}>
            ✓
          </span>
          <h1 className="text-2xl font-bold" style={{ color: C.navy }}>
            Recarga lista
          </h1>
          <p style={{ color: C.textSec }}>
            Acreditamos {dinero(hecha.monto)} a tu saldo de {local.nombre}.
          </p>
        </div>
        <Tarjeta className="flex flex-col gap-2 text-sm">
          <Fila etiqueta={`Saldo en ${local.nombre}`} valor={dinero(hecha.saldo)} fuerte />
          <Fila etiqueta="Operación" valor={hecha.numero_operacion} />
          <p className="pt-1 text-xs" style={{ color: C.textMuted }}>
            Comprobante interno sin validez tributaria.
          </p>
        </Tarjeta>
        <div className="mt-auto">
          <BotonPrincipal onClick={onVolver}>Ir al menú</BotonPrincipal>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Volver onClick={onVolver} titulo={`Recargar en ${local.nombre}`} />
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <Tarjeta>
          <p className="mb-3 text-sm font-medium" style={{ color: C.textSec }}>
            ¿Cuánto quieres recargar?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {["5", "10", "20", "50"].map((m) => (
              <button
                key={m}
                onClick={() => setMonto(m)}
                className="cifras rounded-xl py-2.5 font-semibold"
                style={
                  monto === m
                    ? { background: C.navy, color: "#FFFFFF" }
                    : { background: C.sunken, color: C.navy }
                }
              >
                ${m}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ border: `1px solid ${C.borderStrong}` }}>
            <span style={{ color: C.textSec }}>$</span>
            <input
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ""))}
              className="cifras w-full text-lg font-semibold outline-none"
              style={{ color: C.text }}
              aria-label="Otro monto"
            />
          </label>
        </Tarjeta>
        {/* RF-08 c6: advertir antes de confirmar que el saldo es de este local. */}
        <Aviso tipo="info" texto={`Este saldo solo se puede usar en ${local.nombre}. El dinero va directo a la cuenta del local.`} />
        <p className="rounded-xl p-3 text-xs" style={{ background: C.warnBg, color: C.warnText }}>
          Pasarela de demostración: no se cobra dinero real. En producción aquí se abre la pasarela de
          pagos.
        </p>
        <Aviso texto={error} />
        <div className="mt-auto">
          <BotonPrincipal verde onClick={confirmar} disabled={enviando || !(Number(monto) > 0)}>
            {enviando ? "Procesando…" : `Recargar ${dinero(Number(monto) || 0)}`}
          </BotonPrincipal>
        </div>
      </div>
    </div>
  );
}

// ── Código de retiro (RF-23, RNF-P-02) ──────────────────────────────────────

function DigitosCodigo({ codigo, apagado = false }: { codigo: string; apagado?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Código ${codigoLegible(codigo)}`}>
      {codigo.split("").map((d, i) => (
        <span key={i} className="contents">
          {i === 3 && <span className="w-2" />}
          <span
            className="cifras flex h-14 w-11 items-center justify-center rounded-xl text-3xl font-bold"
            style={{
              background: apagado ? C.sunken : "#FFFFFF",
              color: apagado ? C.textMuted : C.navy,
              border: `2px solid ${apagado ? C.border : C.green}`,
              fontFamily: "var(--font-poppins)",
              textDecoration: apagado ? "line-through" : "none",
            }}
          >
            {d}
          </span>
        </span>
      ))}
    </div>
  );
}

function CodigoRetiro({
  local,
  orden,
  saldo,
  onPedidos,
  onMenu,
}: {
  local: LocalDetalle;
  orden: Orden;
  saldo?: string;
  onPedidos: () => void;
  onMenu: () => void;
}) {
  const vigente = orden.estado === "COMPRADO";
  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="mt-2 flex flex-col items-center gap-1 text-center">
        <Etiqueta tono={orden.es_canje ? "ambar" : "verde"}>
          {orden.es_canje ? "⭐ Premio de fidelidad" : "Pagado"}
        </Etiqueta>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: C.navy }}>
          {vigente ? "Tu almuerzo está pedido" : orden.estado === "ENTREGADO" ? "Pedido entregado" : "Código vencido"}
        </h1>
        <p className="text-sm" style={{ color: C.textSec }}>
          Pedido {orden.numero} · {local.nombre}
        </p>
      </div>
      <div className="rounded-3xl p-5" style={{ background: C.mint }}>
        <p className="mb-3 text-center text-sm font-medium" style={{ color: C.greenText }}>
          {vigente ? "Dicta este código en el mostrador" : "Este código ya no es válido"}
        </p>
        <DigitosCodigo codigo={orden.codigo} apagado={!vigente} />
        {vigente && (
          <p className="mt-4 text-center font-semibold" style={{ color: C.navy }}>
            Retíralo hoy hasta las {orden.hora_maxima_retiro}
          </p>
        )}
      </div>
      <Tarjeta className="flex flex-col gap-2 text-sm">
        {orden.lineas.map((l) => (
          <Fila key={l.plato} etiqueta={`${l.cantidad} × ${l.emoji ?? ""} ${l.plato}`} valor={dinero(Number(l.precio_unitario) * l.cantidad)} />
        ))}
        {orden.es_canje && <Fila etiqueta={orden.motivo_descuento ?? "Premio"} valor={`− ${dinero(orden.descuento)}`} />}
        <div className="my-1 h-px" style={{ background: C.border }} />
        <Fila etiqueta="Total pagado" valor={dinero(orden.total)} fuerte />
        {saldo && <Fila etiqueta={`Saldo restante en ${local.nombre}`} valor={dinero(saldo)} />}
        <p className="pt-1 text-xs" style={{ color: C.textMuted }}>
          Comprobante interno sin validez tributaria. La factura la emite el local.
        </p>
      </Tarjeta>
      <div className="mt-auto flex flex-col gap-2">
        <BotonPrincipal onClick={onPedidos}>Ver mis pedidos</BotonPrincipal>
        <button onClick={onMenu} className="py-2 text-sm font-semibold" style={{ color: C.navy }}>
          Volver al menú
        </button>
      </div>
    </div>
  );
}

// ── Pedidos (RF-24) ─────────────────────────────────────────────────────────

const ESTADO: Record<Orden["estado"], { texto: string; tono: "verde" | "gris" | "ambar" }> = {
  COMPRADO: { texto: "Por retirar", tono: "ambar" },
  ENTREGADO: { texto: "Entregado", tono: "verde" },
  EXPIRADO: { texto: "Vencido", tono: "gris" },
};

function Pedidos({ onCodigo }: { onCodigo: (o: Orden) => void }) {
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null);
  useEffect(() => {
    api<Orden[]>("/estudiante/ordenes").then(setOrdenes);
  }, []);
  if (!ordenes) return <p style={{ color: C.textSec }}>Cargando…</p>;
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold" style={{ color: C.navy }}>
        Mis pedidos
      </h1>
      {ordenes.length === 0 && <p style={{ color: C.textSec }}>Todavía no tienes pedidos.</p>}
      {ordenes.map((o) => (
        <button key={o.id} onClick={() => onCodigo(o)} className="text-left">
          <Tarjeta className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm" style={{ color: C.textSec }}>
                {fecha(o.fecha_hora)} · {hora(o.fecha_hora)}
              </span>
              <div className="flex gap-1.5">
                {o.es_canje && <Etiqueta tono="navy">⭐ Premio</Etiqueta>}
                <Etiqueta tono={ESTADO[o.estado].tono}>{ESTADO[o.estado].texto}</Etiqueta>
              </div>
            </div>
            <p className="font-medium" style={{ color: C.text }}>
              {o.lineas.map((l) => `${l.cantidad} × ${l.plato}`).join(", ")}
            </p>
            <div className="flex items-center justify-between text-sm">
              {o.estado === "COMPRADO" ? (
                <span className="cifras font-bold tracking-widest" style={{ color: C.navy }}>
                  {codigoLegible(o.codigo)}
                </span>
              ) : (
                <span style={{ color: C.textMuted }}>{o.numero}</span>
              )}
              <span className="cifras" style={{ color: C.text }}>
                {o.es_canje ? `${dinero(o.subtotal)} − 100%` : dinero(o.total)}
              </span>
            </div>
          </Tarjeta>
        </button>
      ))}
    </div>
  );
}

// ── Tarjeta de sellos (RF-34, RF-35) ────────────────────────────────────────

function Sellos({ local, onCanjear }: { local: LocalDetalle; onCanjear: () => void }) {
  const c = local.cartilla;
  if (!c) {
    return <Aviso tipo="info" texto={`${local.nombre} todavía no tiene tarjeta de sellos.`} />;
  }
  const faltan = c.requeridos - c.sellos;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold" style={{ color: C.navy }}>
        Tarjeta de sellos
      </h1>
      <div className="rounded-3xl p-5 text-white" style={{ background: C.navy }}>
        <div className="flex items-center justify-between">
          <p className="font-semibold">{local.nombre}</p>
          <p className="cifras text-sm text-white/80">
            {c.sellos} de {c.requeridos}
          </p>
        </div>
        <div className="my-4 grid grid-cols-4 gap-3">
          {Array.from({ length: c.requeridos }, (_, i) => (
            <span
              key={i}
              className="flex aspect-square items-center justify-center rounded-full text-xl font-bold"
              style={
                i < c.sellos
                  ? { background: C.green, color: C.navyDeep }
                  : { border: "2px dashed rgba(255,255,255,0.35)", color: "rgba(255,255,255,0.4)" }
              }
              aria-label={i < c.sellos ? "Sello" : "Pendiente"}
            >
              {i < c.sellos ? "✓" : i + 1}
            </span>
          ))}
        </div>
        <p className="text-sm text-white/85">
          Premio: <strong>{c.premio}</strong>
        </p>
      </div>
      {c.completa ? (
        <>
          <Aviso tipo="ok" texto="¡Completaste tu tarjeta! Ya puedes canjear tu premio." />
          <BotonPrincipal verde onClick={onCanjear}>
            Canjear premio
          </BotonPrincipal>
        </>
      ) : (
        <Aviso tipo="info" texto={`Te ${faltan === 1 ? "falta 1 sello" : `faltan ${faltan} sellos`} para tu premio.`} />
      )}
      <Tarjeta className="flex flex-col gap-1.5 text-sm" >
        <p className="font-semibold" style={{ color: C.text }}>
          Cómo funciona
        </p>
        <p style={{ color: C.textSec }}>• Recibes un sello cuando retiras tu pedido, no al pagarlo.</p>
        <p style={{ color: C.textSec }}>
          • Máximo {c.max_sellos_por_dia} {c.max_sellos_por_dia === 1 ? "sello" : "sellos"} por día.
        </p>
        <p style={{ color: C.textSec }}>• Los sellos de {local.nombre} solo cuentan en {local.nombre}.</p>
        {c.vence && <p style={{ color: C.textSec }}>• Tu tarjeta vence el {fecha(c.vence + "T12:00:00")}.</p>}
      </Tarjeta>
    </div>
  );
}

function Canje({
  local,
  onVolver,
  onCanjeado,
}: {
  local: LocalDetalle;
  onVolver: () => void;
  onCanjeado: (o: Orden) => void;
}) {
  const [elegido, setElegido] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const disponibles = local.menu.filter((p) => p.disponible);

  async function canjear() {
    if (!elegido) return;
    setError(null);
    setEnviando(true);
    try {
      onCanjeado(await post<Orden>(`/estudiante/locales/${local.id}/canje`, { plato_id: elegido }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo canjear");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Volver onClick={onVolver} titulo="Canjear premio" />
      <div className="flex flex-1 flex-col gap-3 px-4 pb-6">
        <p className="text-sm" style={{ color: C.textSec }}>
          Premio: <strong>{local.cartilla?.premio}</strong>. Elige tu plato; no se descuenta de tu saldo.
        </p>
        {disponibles.map((p) => (
          <button key={p.id} onClick={() => setElegido(p.id)} className="text-left">
            <div
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{ background: C.card, border: `2px solid ${elegido === p.id ? C.green : C.border}` }}
            >
              <Emoji e={p.emoji} tamaño={40} />
              <span className="flex-1 font-medium" style={{ color: C.text }}>
                {p.nombre}
              </span>
              <span className="cifras text-sm line-through" style={{ color: C.textMuted }}>
                {dinero(p.precio)}
              </span>
            </div>
          </button>
        ))}
        <Aviso texto={error} />
        <div className="mt-auto">
          <BotonPrincipal verde onClick={canjear} disabled={!elegido || enviando}>
            {enviando ? "Canjeando…" : "Canjear sin costo"}
          </BotonPrincipal>
        </div>
      </div>
    </div>
  );
}

// ── Perfil ──────────────────────────────────────────────────────────────────

function Perfil({ usuario, salir }: { usuario: Usuario; salir: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold" style={{ color: C.navy }}>
        Perfil
      </h1>
      <Tarjeta className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: C.navy }}>
          {usuario.nombre.charAt(0)}
        </span>
        <div>
          <p className="font-semibold" style={{ color: C.text }}>
            {usuario.nombre}
          </p>
          <p className="text-sm" style={{ color: C.textSec }}>
            {usuario.email}
          </p>
        </div>
      </Tarjeta>
      <Tarjeta>
        <p className="font-semibold" style={{ color: C.navy }}>
          Pide antes. Sin filas.
        </p>
        <p className="mt-1 text-sm" style={{ color: C.textSec }}>
          Aliflow te devuelve el tiempo de tu recreo: pagas antes, retiras con tu código y vuelves a lo
          que importa.
        </p>
      </Tarjeta>
      <button
        onClick={salir}
        className="rounded-2xl py-3 font-semibold"
        style={{ color: C.errorText, background: C.card, border: `1px solid ${C.border}` }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
