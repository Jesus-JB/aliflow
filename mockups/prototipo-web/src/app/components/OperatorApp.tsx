import { useState } from "react";
import { Check, X, AlertCircle, Delete, ChevronDown } from "lucide-react";
import { useStore, Order } from "../store";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  orange: "#E05423",
  orangeBg: "#FDEAE1",
  text: "#14161A",
  textSec: "#5A6472",
  textMuted: "#98A1AE",
  pageBg: "#F5F6F8",
  card: "#FFFFFF",
  sunken: "#EDEFF3",
  border: "#E4E7EC",
  borderStrong: "#C6CCD6",
  successBg: "#DCF5EB",
  successText: "#12805C",
  successDark: "#0A5C3E",
  warnBg: "#FDF0DC",
  warnText: "#9A5B00",
  errorBg: "#FCE6E2",
  errorText: "#C4321F",
  errorDark: "#9A1E0E",
  infoBg: "#E4EBFD",
  infoText: "#2B5CE6",
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const OPERATOR_POINTS = [
  "Barú · Planta baja",
  "Barú · Segundo piso",
  "Caramel Coffee · Entrada",
  "Caramel Coffee · Patio",
];

function OperatorLogin({ onLogin }: { onLogin: () => void }) {
  const { operatorLogin } = useStore();
  const [user, setUser] = useState("operador1@baru.com.ec");
  const [pass, setPass] = useState("12345678");
  const [point, setPoint] = useState(OPERATOR_POINTS[0]);
  const [error, setError] = useState(false);

  function handleLogin() {
    if (operatorLogin(user, pass, point)) {
      onLogin();
    } else {
      setError(true);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.pageBg }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", gap: 28 }}>

        {/* Logo + title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 22,
            background: `linear-gradient(145deg, ${C.orange}, #C03A12)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(224,84,35,0.35)",
          }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: "#fff", fontFamily: "Inter, sans-serif", letterSpacing: -1 }}>123</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 24, color: C.text, letterSpacing: -0.5 }}>Entregas</div>
            <div style={{ fontSize: 13, color: C.textSec, marginTop: 3 }}>Interfaz de Operador · optimizada para el mostrador</div>
          </div>
        </div>

        {/* Form */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Usuario">
            <input
              value={user}
              onChange={(e) => { setUser(e.target.value); setError(false); }}
              autoCapitalize="none"
              style={inputStyle}
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(false); }}
              style={inputStyle}
            />
          </Field>
          <Field label="Punto de entrega">
            <div style={{ position: "relative" }}>
              <select
                value={point}
                onChange={(e) => setPoint(e.target.value)}
                style={{ ...inputStyle, appearance: "none", paddingRight: 36 }}
              >
                {OPERATOR_POINTS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <ChevronDown size={16} color={C.textMuted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </Field>

          {error && (
            <div style={{ background: C.errorBg, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.errorText, display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={15} />
              Usuario o contraseña incorrectos
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              marginTop: 4, background: C.orange, color: "#fff", border: "none",
              borderRadius: 14, padding: "16px 0", cursor: "pointer",
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16,
              boxShadow: "0 4px 16px rgba(224,84,35,0.3)",
            }}
          >
            Ingresar
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
          Credenciales propias del rol, no institucionales (UCId).<br />
          Cada local administra sus propios operadores.
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 14px", borderRadius: 12,
  border: `1.5px solid ${C.border}`, fontFamily: "Inter, sans-serif",
  fontSize: 15, color: C.text, background: C.card, outline: "none",
  boxSizing: "border-box", transition: "border-color 0.15s",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, letterSpacing: 0.2 }}>{label}</label>
      {children}
    </div>
  );
}

// ─── VALIDATOR ────────────────────────────────────────────────────────────────
type ValidatorResult =
  | null
  | { type: "success"; order: Order }
  | { type: "already_used"; order: Order }
  | { type: "invalid"; code: string };

function ValidatorScreen({ onLogout }: { onLogout: () => void }) {
  const { validateCode, loyaltyCards, operatorName, operatorPoint, orders } = useStore();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ValidatorResult>(null);
  const [shake, setShake] = useState(false);

  // Count pending orders for this point
  const pending = orders.filter((o) => o.status === "pendiente").length;

  function pressKey(k: string) {
    if (input.length < 6) setInput((p) => p + k);
  }

  function pressBackspace() {
    setInput((p) => p.slice(0, -1));
  }

  function pressClear() {
    setInput("");
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function handleValidate() {
    if (input.length !== 6) { triggerShake(); return; }
    const res = validateCode(input);
    if (res.success && res.order) {
      setResult({ type: "success", order: res.order });
    } else if (res.alreadyUsed && res.order) {
      setResult({ type: "already_used", order: res.order });
      triggerShake();
    } else {
      setResult({ type: "invalid", code: input });
      triggerShake();
    }
  }

  function reset() {
    setInput("");
    setResult(null);
  }

  // Auto-validate when 6 digits are filled? No — keep the confirm button explicit.

  if (result?.type === "success") {
    return <ConfirmedScreen order={result.order} loyaltyCards={loyaltyCards} onAnother={reset} onLogout={onLogout} />;
  }
  if (result?.type === "already_used") {
    return <AlreadyUsedScreen order={result.order} onAnother={reset} />;
  }
  if (result?.type === "invalid") {
    return <InvalidScreen code={result.code} onAnother={reset} />;
  }

  const ready = input.length === 6;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.pageBg, overflow: "hidden" }}>

      {/* ── Compact header ──────────────────────────────────────── */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: "48px 20px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>
            Operador: <strong style={{ color: C.textSec }}>{operatorName}</strong>
            {pending > 0 && (
              <span style={{ marginLeft: 6, background: C.orange, color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>
                {pending} pendiente{pending !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{operatorPoint}</div>
        </div>
        <button
          onClick={onLogout}
          style={{ fontSize: 12, color: C.errorText, background: "none", border: `1px solid ${C.errorText}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600 }}
        >
          Salir
        </button>
      </div>

      {/* ── Digit display ───────────────────────────────────────── */}
      <div style={{ padding: "14px 20px 10px", background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 10, textAlign: "center", fontWeight: 500 }}>
          Teclea el código que te dicta el estudiante
        </div>

        {/* 6 boxes */}
        <div
          style={{
            display: "flex", justifyContent: "center", gap: 7,
            animation: shake ? "shake 0.45s ease" : "none",
          }}
        >
          {Array.from({ length: 6 }, (_, i) => {
            const digit = input[i] ?? "";
            const isActive = i === input.length && !ready;
            const isFilled = !!digit;
            return (
              <div
                key={i}
                style={{
                  width: 48, height: 60, borderRadius: 12,
                  border: `2px solid ${isActive ? C.orange : isFilled ? C.text : C.borderStrong}`,
                  background: isFilled ? C.card : C.sunken,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 800, color: C.text,
                  fontFamily: "Inter, sans-serif",
                  boxShadow: isActive ? `0 0 0 3px ${C.orangeBg}` : "none",
                  transition: "border-color 0.12s, box-shadow 0.12s",
                }}
              >
                {digit}
              </div>
            );
          })}
        </div>

        {!ready && input.length === 0 && (
          <div style={{ textAlign: "center", fontSize: 11, color: C.textMuted, marginTop: 8 }}>
            No se escanea nada · el código de 6 dígitos numéricos te lo dice el estudiante en voz alta
          </div>
        )}
      </div>

      {/* ── Keypad fills remaining space ────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px 14px 0", gap: 8, minHeight: 0 }}>
        {/* Rows 1-3: number keys */}
        {[["1","2","3"], ["4","5","6"], ["7","8","9"]].map((row) => (
          <div key={row[0]} style={{ flex: 1, display: "flex", gap: 8, minHeight: 0 }}>
            {row.map((k) => (
              <NumKey key={k} label={k} onClick={() => pressKey(k)} />
            ))}
          </div>
        ))}
        {/* Row 4: clear / 0 / backspace */}
        <div style={{ flex: 1, display: "flex", gap: 8, minHeight: 0 }}>
          <NumKey label="C" sublabel="Borrar" onClick={pressClear} variant="util" />
          <NumKey label="0" onClick={() => pressKey("0")} />
          <NumKey label="⌫" onClick={pressBackspace} variant="util" icon={<Delete size={22} color={C.textSec} />} />
        </div>
      </div>

      {/* ── Validate button ─────────────────────────────────────── */}
      <div style={{ padding: "10px 14px 20px" }}>
        <button
          onClick={handleValidate}
          style={{
            width: "100%", padding: "18px 0",
            background: ready ? C.orange : C.borderStrong,
            color: "#fff", border: "none", borderRadius: 14, cursor: ready ? "pointer" : "not-allowed",
            fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 17,
            boxShadow: ready ? "0 4px 16px rgba(224,84,35,0.35)" : "none",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          {ready ? "Validar y entregar →" : "Validar y entregar"}
        </button>
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-6px); }
          30%      { transform: translateX(6px); }
          45%      { transform: translateX(-5px); }
          60%      { transform: translateX(5px); }
          75%      { transform: translateX(-3px); }
          90%      { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}

// ─── NUM KEY ──────────────────────────────────────────────────────────────────
function NumKey({
  label, sublabel, onClick, variant = "digit", icon,
}: {
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant?: "digit" | "util";
  icon?: React.ReactNode;
}) {
  const isUtil = variant === "util";
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: isUtil ? C.sunken : C.card,
        border: `1.5px solid ${C.border}`,
        borderRadius: 14,
        cursor: "pointer",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 2,
        // Physical key shadow: bottom edge is darker
        boxShadow: isUtil
          ? "0 2px 0 #C6CCD6, 0 1px 4px rgba(0,0,0,0.06)"
          : "0 3px 0 #D4D8DE, 0 1px 4px rgba(0,0,0,0.07)",
        // Shrink on press
        transition: "transform 0.07s, box-shadow 0.07s",
        minHeight: 0,
        // active state via :active — do it with onPointerDown
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      onPointerDown={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(2px)";
        el.style.boxShadow = isUtil
          ? "0 0 0 #C6CCD6, 0 1px 2px rgba(0,0,0,0.06)"
          : "0 0 0 #D4D8DE, 0 1px 2px rgba(0,0,0,0.07)";
      }}
      onPointerUp={(e) => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.boxShadow = "";
      }}
      onPointerLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.boxShadow = "";
      }}
    >
      {icon ? icon : (
        <span style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: isUtil ? 600 : 700,
          fontSize: isUtil ? 18 : 26,
          color: isUtil ? C.textSec : C.text,
          lineHeight: 1,
        }}>
          {label}
        </span>
      )}
      {sublabel && (
        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "Inter, sans-serif", marginTop: 2 }}>
          {sublabel}
        </span>
      )}
    </button>
  );
}

// ─── CONFIRMED ────────────────────────────────────────────────────────────────
function ConfirmedScreen({
  order, loyaltyCards, onAnother, onLogout,
}: {
  order: Order;
  loyaltyCards: Record<string, any>;
  onAnother: () => void;
  onLogout: () => void;
}) {
  const localId = order.items[0]?.localId ?? "";
  const card = loyaltyCards[localId];
  const stampsNow = card?.stampsEarned ?? 0;
  const stampsTotal = card?.stampsRequired ?? 8;
  const deliveredTime = order.deliveredAt
    ? order.deliveredAt.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F0FBF6", overflow: "hidden" }}>
      {/* Green banner */}
      <div style={{
        background: C.successText,
        padding: "52px 24px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: "50%",
          background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          <Check size={36} color={C.successText} strokeWidth={3} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 22, color: "#fff" }}>Entrega confirmada</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
            La orden pasó a Entregado y el código quedó invalidado.
          </div>
        </div>
      </div>

      {/* Scrollable details */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Order card */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>Orden {order.id}</span>
            <span style={{
              background: C.successBg, color: C.successText,
              borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "3px 10px",
            }}>
              ● Entregado
            </span>
          </div>
          {[
            { label: "Estudiante", value: "Ana M." },
            { label: "Plato", value: order.items[0]?.dishName ?? "—" },
            { label: "Monto", value: `$${order.total.toFixed(2)}` },
            { label: "Entregado", value: `Hoy ${deliveredTime}` },
            { label: "Código usado", value: order.pickupCode },
            { label: "Punto de entrega", value: order.deliveryPoint ?? "—" },
          ].map((r, i, arr) => (
            <div
              key={r.label}
              style={{
                display: "flex", justifyContent: "space-between", padding: "7px 0",
                borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <span style={{ fontSize: 12, color: C.textSec }}>{r.label}</span>
              <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Stamp credited / redemption note */}
        {!order.isRedemption && card ? (
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Sello acreditado</span>
              <span style={{
                background: C.orangeBg, color: C.orange,
                borderRadius: 999, fontSize: 12, fontWeight: 800, padding: "3px 12px",
              }}>
                {stampsNow}/{stampsTotal}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
              {Array.from({ length: stampsTotal }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: i < stampsNow ? C.orange : C.sunken,
                    border: `2px solid ${i < stampsNow ? C.orange : C.borderStrong}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    // Newest stamp pulses
                    animation: i === stampsNow - 1 ? "stampPop 0.4s ease" : "none",
                  }}
                >
                  {i < stampsNow && <Check size={14} color="#fff" strokeWidth={3} />}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted }}>
              Al confirmar la entrega se acredita 1 sello. Máximo 1 sello por día.
            </div>
            {stampsNow >= stampsTotal && (
              <div style={{ marginTop: 10, background: C.orangeBg, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: C.orange, fontWeight: 600 }}>
                🎉 ¡Cartilla completa! El estudiante puede canjear su premio.
              </div>
            )}
          </div>
        ) : order.isRedemption ? (
          <div style={{ background: C.infoBg, borderRadius: 16, border: `1px solid ${C.infoText}`, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, color: C.infoText, fontWeight: 700, marginBottom: 4 }}>Premio canjeado · $0.00</div>
            <div style={{ fontSize: 12, color: C.infoText, lineHeight: 1.5 }}>
              La cartilla fue reiniciada a 0. No se acredita sello por canje de premio.
            </div>
          </div>
        ) : null}
      </div>

      {/* Buttons */}
      <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onAnother}
          style={{
            background: C.orange, color: "#fff", border: "none", borderRadius: 14,
            padding: "17px 0", cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16,
            boxShadow: "0 4px 16px rgba(224,84,35,0.3)",
          }}
        >
          Validar otro código
        </button>
        <button
          onClick={onLogout}
          style={{
            background: "none", border: `1.5px solid ${C.successText}`, borderRadius: 14,
            padding: "14px 0", cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: C.successText,
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <style>{`
        @keyframes stampPop {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.25); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── ALREADY USED ─────────────────────────────────────────────────────────────
function AlreadyUsedScreen({ order, onAnother }: { order: Order; onAnother: () => void }) {
  const deliveredTime = order.deliveredAt
    ? order.deliveredAt.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FEF4F3", overflow: "hidden" }}>
      {/* Red banner */}
      <div style={{
        background: C.errorText,
        padding: "52px 24px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: "50%",
          background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          <AlertCircle size={36} color={C.errorText} strokeWidth={2.5} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 22, color: "#fff" }}>Código ya utilizado</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
            Esta orden ya fue Entregada. El código es de un solo uso.
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Details */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 12 }}>Detalles de la entrega anterior</div>
          {[
            { label: "Código", value: order.pickupCode },
            { label: "Orden", value: order.id },
            { label: "Entregado", value: `Hoy ${deliveredTime}` },
            { label: "Operador", value: order.deliveredBy ?? "—" },
            { label: "Punto de entrega", value: order.deliveryPoint ?? "—" },
          ].map((r, i, arr) => (
            <div
              key={r.label}
              style={{
                display: "flex", justifyContent: "space-between", padding: "7px 0",
                borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <span style={{ fontSize: 12, color: C.textSec }}>{r.label}</span>
              <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>¿Qué más puede pasar?</div>
          <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.7 }}>
            Si el estudiante dice que es la primera entrega, verifica la hora y el operador de arriba. Si no coincide con tu turno, pide al estudiante que contacte al administrador. En ningún caso vuelvas a entregar sin un código válido.
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onAnother}
          style={{
            background: C.errorText, color: "#fff", border: "none", borderRadius: 14,
            padding: "17px 0", cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16,
          }}
        >
          Teclear otro código
        </button>
        <button
          style={{
            background: "none", border: `1.5px solid ${C.errorText}`, borderRadius: 14,
            padding: "14px 0", cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: C.errorText,
          }}
        >
          Buscar por nombre o ID (UCId)
        </button>
      </div>
    </div>
  );
}

// ─── INVALID ──────────────────────────────────────────────────────────────────
function InvalidScreen({ code, onAnother }: { code: string; onAnother: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FEF4F3", overflow: "hidden" }}>
      {/* Red banner */}
      <div style={{
        background: C.errorText,
        padding: "52px 24px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: "50%",
          background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          <X size={36} color={C.errorText} strokeWidth={2.5} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 22, color: "#fff" }}>Código inválido</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
            No existe ninguna orden con el código <strong>{code}</strong>.
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>¿Qué puede haber salido mal?</div>
          {[
            "El estudiante dictó un dígito equivocado — pídele que repita.",
            "La orden todavía no se procesó — espera 5 segundos y vuelve a intentar.",
            "El código pertenece a otro punto de entrega.",
            "El estudiante no ha completado la compra.",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ color: C.orange, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px 24px" }}>
        <button
          onClick={onAnother}
          style={{
            width: "100%", background: C.errorText, color: "#fff", border: "none",
            borderRadius: 14, padding: "17px 0", cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16,
          }}
        >
          Teclear otro código
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function OperatorApp() {
  const { operatorLoggedIn, operatorLogout } = useStore();

  if (!operatorLoggedIn) return <OperatorLogin onLogin={() => { /* operatorLogin ya marcó la sesión */ }} />;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ValidatorScreen onLogout={operatorLogout} />
    </div>
  );
}
