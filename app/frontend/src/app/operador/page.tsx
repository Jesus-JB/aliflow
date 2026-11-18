"use client";

import { useCallback, useEffect, useState } from "react";

import { Aviso, Panel } from "@/components/Panel";
import { api, codigoLegible, dinero, ErrorApi, hora, type Orden, post, type Sello } from "@/lib/api";
import { C } from "@/lib/tokens";

export default function PaginaOperador() {
  return (
    <Panel rol="OPERADOR" ancho="max-w-md">
      {() => <Mostrador />}
    </Panel>
  );
}

type Turno = { local: string; pendientes: number; entregadas: number; ultimas: Orden[] };
type Resultado =
  | { tipo: "orden"; orden: Orden }
  | { tipo: "entregada"; orden: Orden; sello: Sello | null }
  | { tipo: "error"; mensaje: string; caso: "inexistente" | "usado" | "vencido" | "otro" };

/** RF-25 a RF-28: el Operador teclea el código; no hay lector de QR. */
function Mostrador() {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [turno, setTurno] = useState<Turno | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    api<Turno>("/operador/turno").then(setTurno);
    const t = setInterval(() => api<Turno>("/operador/turno").then(setTurno), 15000);
    return () => clearInterval(t);
  }, [version]);

  const teclear = useCallback(
    (d: string) => {
      setResultado(null);
      setCodigo((c) => (d === "⌫" ? c.slice(0, -1) : c.length < 6 ? c + d : c));
    },
    [setCodigo],
  );

  function error(e: unknown): Resultado {
    const status = e instanceof ErrorApi ? e.status : 0;
    const mensaje = e instanceof Error ? e.message : "Error de conexión";
    const caso = status === 404 ? "inexistente" : status === 409 ? "usado" : status === 410 ? "vencido" : "otro";
    return { tipo: "error", mensaje, caso };
  }

  async function buscar() {
    setOcupado(true);
    try {
      const r = await post<{ orden: Orden }>("/operador/codigos/consultar", { codigo });
      const o = r.orden;
      if (o.estado_codigo === "UTILIZADO") {
        setResultado({
          tipo: "error",
          caso: "usado",
          mensaje: `Este código ya se usó: la orden se entregó a las ${o.entregado_en ? hora(o.entregado_en) : ""}`,
        });
      } else if (o.estado_codigo === "VENCIDO") {
        setResultado({ tipo: "error", caso: "vencido", mensaje: "Este código está vencido: era válido solo el día de la compra" });
      } else {
        setResultado({ tipo: "orden", orden: o });
      }
    } catch (e) {
      setResultado(error(e));
    } finally {
      setOcupado(false);
    }
  }

  async function entregar() {
    setOcupado(true);
    try {
      const r = await post<{ orden: Orden; sello: Sello | null }>("/operador/codigos/entregar", { codigo });
      setResultado({ tipo: "entregada", orden: r.orden, sello: r.sello });
      setVersion((v) => v + 1);
    } catch (e) {
      setResultado(error(e));
    } finally {
      setOcupado(false);
    }
  }

  function siguiente() {
    setCodigo("");
    setResultado(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {turno && (
        <div className="grid grid-cols-2 gap-3">
          <Cifra etiqueta="Por retirar hoy" valor={turno.pendientes} color={C.warnText} fondo={C.warnBg} />
          <Cifra etiqueta="Entregados hoy" valor={turno.entregadas} color={C.greenText} fondo={C.mint} />
        </div>
      )}

      {/* El código tecleado, en dos grupos para leerlo como se dicta. */}
      <div className="rounded-3xl p-5 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <p className="mb-3 text-sm font-medium" style={{ color: C.textSec }}>
          Código de retiro
        </p>
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="contents">
              {i === 3 && <span className="w-2" />}
              <span
                className="cifras flex h-14 w-11 items-center justify-center rounded-xl text-3xl font-bold"
                style={{
                  background: C.pageBg,
                  color: C.navy,
                  border: `2px solid ${i === codigo.length ? C.green : C.border}`,
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {codigo[i] ?? ""}
              </span>
            </span>
          ))}
        </div>
      </div>

      <ResultadoTarjeta resultado={resultado} />

      {/* RNF-P-04: las acciones en la mitad inferior, al alcance del pulgar. */}
      {resultado?.tipo === "orden" ? (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={siguiente} className="rounded-2xl py-4 font-semibold" style={{ background: C.sunken, color: C.navy }}>
            Cancelar
          </button>
          <button
            onClick={entregar}
            disabled={ocupado}
            className="col-span-2 rounded-2xl py-4 text-lg font-semibold text-white disabled:opacity-60"
            style={{ background: C.greenAction }}
          >
            Entregar pedido
          </button>
        </div>
      ) : resultado ? (
        <button onClick={siguiente} className="rounded-2xl py-4 text-lg font-semibold text-white" style={{ background: C.navy }}>
          Siguiente código
        </button>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0"].map((d) => (
              <button
                key={d}
                onClick={() => teclear(d)}
                aria-label={d === "⌫" ? "Borrar" : d}
                className="cifras rounded-2xl py-4 text-2xl font-semibold"
                style={{ background: C.card, color: C.navy, border: `1px solid ${C.border}` }}
              >
                {d}
              </button>
            ))}
            <button
              onClick={buscar}
              disabled={codigo.length !== 6 || ocupado}
              className="rounded-2xl py-4 text-lg font-semibold text-white disabled:opacity-40"
              style={{ background: C.navy }}
            >
              Buscar
            </button>
          </div>
        </>
      )}

      {turno && turno.ultimas.length > 0 && (
        <section className="mt-2">
          <h2 className="mb-2 text-sm font-semibold" style={{ color: C.textSec }}>
            Últimas entregas
          </h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {turno.ultimas.map((o) => (
              <li key={o.id} className="flex justify-between rounded-xl px-3 py-2" style={{ background: C.card }}>
                <span style={{ color: C.text }}>
                  {o.estudiante} · {o.lineas.map((l) => l.plato).join(", ")}
                  {o.es_canje && " ⭐"}
                </span>
                <span style={{ color: C.textMuted }}>{o.entregado_en ? hora(o.entregado_en) : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Cifra({ etiqueta, valor, color, fondo }: { etiqueta: string; valor: number; color: string; fondo: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: fondo }}>
      <p className="text-xs font-medium" style={{ color }}>
        {etiqueta}
      </p>
      <p className="cifras text-2xl font-bold" style={{ color, fontFamily: "var(--font-poppins)" }}>
        {valor}
      </p>
    </div>
  );
}

function ResultadoTarjeta({ resultado }: { resultado: Resultado | null }) {
  if (!resultado) return null;
  if (resultado.tipo === "error") {
    // RF-28: los tres casos se distinguen a simple vista.
    const titulo = { inexistente: "Código inexistente", usado: "Código ya utilizado", vencido: "Código vencido", otro: "No se pudo validar" }[
      resultado.caso
    ];
    const estilo =
      resultado.caso === "vencido" ? { background: C.warnBg, color: C.warnText } : { background: C.errorBg, color: C.errorText };
    return (
      <div role="alert" className="rounded-3xl p-4" style={estilo}>
        <p className="text-lg font-bold">{titulo}</p>
        <p className="text-sm">{resultado.mensaje}</p>
      </div>
    );
  }
  const o = resultado.orden;
  const entregada = resultado.tipo === "entregada";
  return (
    <div
      className="rounded-3xl p-4"
      style={{ background: entregada ? C.mint : C.card, border: `2px solid ${entregada ? C.green : C.navy}` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold" style={{ color: C.navy }}>
          {entregada ? "✓ Entregado" : o.estudiante}
        </p>
        {o.es_canje && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: C.warnBg, color: C.warnText }}>
            ⭐ Premio
          </span>
        )}
      </div>
      <p className="text-sm" style={{ color: C.textSec }}>
        {o.numero} · código {codigoLegible(o.codigo)}
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {o.lineas.map((l) => (
          <li key={l.plato} className="text-base font-medium" style={{ color: C.text }}>
            {l.cantidad} × {l.emoji} {l.plato}
          </li>
        ))}
      </ul>
      {!o.es_canje && (
        <p className="mt-1 text-sm" style={{ color: C.textSec }}>
          Pagado: {dinero(o.total)}
        </p>
      )}
      {entregada && resultado.sello && (
        <div className="mt-3">
          <Aviso
            tipo={resultado.sello.acreditado ? "ok" : "info"}
            texto={
              resultado.sello.acreditado
                ? `Sello acreditado: ${resultado.sello.sellos} de ${resultado.sello.requeridos}${resultado.sello.completa ? " · ¡tarjeta completa!" : ""}`
                : (resultado.sello.motivo ?? "Sin sello")
            }
          />
        </div>
      )}
    </div>
  );
}
