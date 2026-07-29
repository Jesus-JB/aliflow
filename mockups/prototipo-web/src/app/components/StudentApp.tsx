import { useState, useEffect } from "react";
import { UtensilsCrossed, BookOpen, ClipboardList, User, ArrowLeft, ChevronRight, Check, CreditCard, AlertTriangle, Info } from "lucide-react";
import { useStore, MenuItem, Order, Local, LoyaltyCard as LoyaltyCardType } from "../store";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  orange: "#E05423",
  orangeLight: "#F2743F",
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
  warnBg: "#FDF0DC",
  warnText: "#9A5B00",
  errorBg: "#FCE6E2",
  errorText: "#C4321F",
  infoBg: "#E4EBFD",
  infoText: "#2B5CE6",
};

type StudentTab = "menu" | "cartilla" | "ordenes" | "perfil";
type StudentScreen =
  | { name: "login" }
  | { name: "menu" }
  | { name: "dish-detail"; dish: MenuItem }
  | { name: "confirm-purchase"; dish: MenuItem }
  | { name: "pickup-code"; order: Order }
  | { name: "recharge" }
  | { name: "cartilla" }
  | { name: "redeem-reward"; localId: string }
  | { name: "ordenes" }
  | { name: "perfil" };

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Tag({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ color, backgroundColor: bg, borderRadius: 999, fontSize: 11, fontWeight: 600, padding: "2px 8px", display: "inline-block" }}>
      {children}
    </span>
  );
}

function PendingBadge({ label }: { label: string }) {
  return (
    <div style={{ background: C.warnBg, borderRadius: 8, padding: "6px 10px", display: "flex", gap: 6, alignItems: "flex-start", marginTop: 8 }}>
      <AlertTriangle size={14} color={C.warnText} style={{ marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: C.warnText, lineHeight: "1.4" }}>
        <strong>Pendiente de Negocios:</strong> {label}
      </span>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, ...style }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, style }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? C.borderStrong : C.orange,
        color: "#fff",
        border: "none",
        borderRadius: 12,
        padding: "14px 0",
        width: "100%",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Inter, sans-serif",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, color: C.text }}>
      <ArrowLeft size={20} />
    </button>
  );
}

// ─── Status chip ──────────────────────────────────────────────────────────────
function StatusTag({ status }: { status: Order["status"] }) {
  const map = {
    pendiente: { label: "Pendiente", color: C.warnText, bg: C.warnBg },
    listo: { label: "Listo", color: C.infoText, bg: C.infoBg },
    entregado: { label: "Entregado", color: C.successText, bg: C.successBg },
    canjeado: { label: "Canjeado", color: C.successText, bg: C.successBg },
  };
  const s = map[status];
  return <Tag color={s.color} bg={s.bg}>{s.label}</Tag>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.pageBg }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", gap: 32 }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 32 }}>🍽</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 28, color: C.text, letterSpacing: -0.5 }}>Aliflow</div>
            <div style={{ fontSize: 14, color: C.textSec, marginTop: 4 }}>Pide y paga tu almuerzo del campus</div>
          </div>
        </div>

        {/* Info box */}
        <div style={{ background: C.orangeBg, borderRadius: 16, padding: "16px 18px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.orange, fontWeight: 600 }}>Universidad · Campus Central</div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>2 locales activos · Lunes–Viernes, 8–15 h</div>
        </div>

        {/* Google btn */}
        <button
          onClick={onLogin}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "14px 0", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 15, color: C.text,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
          Continuar con Google
        </button>
      </div>

      <div style={{ padding: "0 24px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
          Solo personal y estudiantes verificados por la Universidad. Las credenciales son administradas por el servicio de identidad (UCId).
        </div>
      </div>
    </div>
  );
}

// ─── BALANCE HEADER ────────────────────────────────────────────────────────────
function BalanceHeader({ balance, name, onRecharge }: { balance: number; name: string; onRecharge: () => void }) {
  return (
    <div style={{ background: C.orange, padding: "48px 20px 20px", borderRadius: "0 0 20px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>Hola, {name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Saldo disponible</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, marginTop: 2 }}>
            ${balance.toFixed(2)}
          </div>
        </div>
        <button
          onClick={onRecharge}
          style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 12, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600 }}
        >
          + Recargar
        </button>
      </div>
    </div>
  );
}

// ─── MENU SCREEN ──────────────────────────────────────────────────────────────
function MenuScreen({ onDishTap, onRecharge }: { onDishTap: (dish: MenuItem) => void; onRecharge: () => void }) {
  const { studentBalance, studentName, locals, menu } = useStore();
  const [selectedLocal, setSelectedLocal] = useState<string>("baru");
  const filteredMenu = menu.filter((m) => m.localId === selectedLocal);
  const today = new Date();
  const dateStr = today.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      <BalanceHeader balance={studentBalance} name={studentName} onRecharge={onRecharge} />

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10, textTransform: "capitalize" }}>{dateStr}</div>
        {/* Local chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {locals.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedLocal(l.id)}
              style={{
                padding: "7px 16px", borderRadius: 999, border: `1px solid ${selectedLocal === l.id ? C.orange : C.border}`,
                background: selectedLocal === l.id ? C.orangeBg : C.card,
                color: selectedLocal === l.id ? C.orange : C.textSec,
                fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 2 }}>Menú del día</div>
        {filteredMenu.map((dish) => (
          <DishCard key={dish.id} dish={dish} onTap={() => dish.stock > 0 && onDishTap(dish)} />
        ))}
      </div>
    </div>
  );
}

function DishCard({ dish, onTap }: { dish: MenuItem; onTap: () => void }) {
  const soldOut = dish.stock === 0;
  return (
    <div
      onClick={soldOut ? undefined : onTap}
      style={{
        background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
        padding: "12px 14px", opacity: soldOut ? 0.6 : 1,
        cursor: soldOut ? "default" : "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: C.orangeBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {dish.imageEmoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 2 }}>{dish.name}</div>
          {/* Deja respirar la descripción en 2 líneas en vez de cortarla en
              una sola con "…": a 390px la versión de una línea perdía casi
              media frase en todos los platos. */}
          <div
            style={{
              fontSize: 12, color: C.textSec, lineHeight: 1.35,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {dish.description}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>${dish.price.toFixed(2)}</span>
            {soldOut ? (
              <Tag color={C.errorText} bg={C.errorBg}>Agotado</Tag>
            ) : (
              <span style={{ fontSize: 11, color: C.textMuted }}>{dish.stock} disp.</span>
            )}
          </div>
        </div>
        {!soldOut && (
          <div style={{ width: 32, height: 32, borderRadius: 999, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ChevronRight size={16} color="#fff" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DISH DETAIL ──────────────────────────────────────────────────────────────
function DishDetailScreen({ dish, onBack, onConfirm }: { dish: MenuItem; onBack: () => void; onConfirm: () => void }) {
  const { studentBalance } = useStore();
  const canBuy = studentBalance >= dish.price && dish.stock > 0;
  const local = dish.localId === "baru" ? "Barú" : "Caramel Coffee";

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div style={{ background: C.orangeBg, padding: "52px 20px 32px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 16, left: 16 }}>
          <BackBtn onClick={onBack} />
        </div>
        <div style={{ fontSize: 72, lineHeight: 1 }}>{dish.imageEmoji}</div>
        <h2 style={{ marginTop: 12, color: C.text }}>{dish.name}</h2>
        <div style={{ fontSize: 13, color: C.textSec, marginTop: 4 }}>{local}</div>
      </div>

      <div style={{ padding: "20px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
        <Card style={{ padding: "16px" }}>
          <div style={{ fontSize: 13, color: C.textSec, marginBottom: 6 }}>Descripción</div>
          <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.5 }}>{dish.description}</p>
        </Card>

        <Card style={{ padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.textSec }}>Precio</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>${dish.price.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: C.textSec }}>Stock</span>
            <span style={{ fontSize: 13, color: C.text }}>{dish.stock} disponibles</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 13, color: C.textSec }}>Punto de entrega</span>
            <span style={{ fontSize: 13, color: C.text }}>{local} · Planta baja</span>
          </div>
        </Card>

        {!canBuy && studentBalance < dish.price && (
          <div style={{ background: C.errorBg, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 8, alignItems: "center" }}>
            <AlertTriangle size={16} color={C.errorText} />
            <span style={{ fontSize: 13, color: C.errorText }}>Saldo insuficiente. Tienes ${studentBalance.toFixed(2)}</span>
          </div>
        )}

        <PrimaryBtn onClick={onConfirm} disabled={!canBuy}>
          Comprar · ${dish.price.toFixed(2)}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── CONFIRM PURCHASE ─────────────────────────────────────────────────────────
function ConfirmPurchaseScreen({ dish, onBack, onPurchase }: { dish: MenuItem; onBack: () => void; onPurchase: (order: Order) => void }) {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const afterBalance = store.studentBalance - dish.price;
  const local = store.locals.find((l) => l.id === dish.localId);

  function handleConfirm() {
    setLoading(true);
    const result = store.purchaseDish(dish);
    setLoading(false);
    if (result.success && result.order) {
      onPurchase(result.order);
    } else {
      setError(result.error || "Error al procesar la compra");
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 20px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={onBack} />
        <h3 style={{ margin: 0 }}>Confirmar compra</h3>
      </div>

      <div style={{ padding: "20px 20px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Item summary */}
        <Card style={{ padding: "16px" }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>DETALLE DE TU PEDIDO</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: C.orangeBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              {dish.imageEmoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: C.text }}>{dish.name}</div>
              <div style={{ fontSize: 12, color: C.textSec }}>{local?.name}</div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>${dish.price.toFixed(2)}</span>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <Row label="Subtotal" value={`$${dish.price.toFixed(2)}`} />
            <Row label="Punto de entrega" value={`${local?.name} · Planta baja`} />
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
              <Row label="Saldo actual" value={`$${store.studentBalance.toFixed(2)}`} />
              <Row label="Saldo después de compra" value={`$${afterBalance.toFixed(2)}`} bold />
            </div>
          </div>
        </Card>

        {error && (
          <div style={{ background: C.errorBg, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 8 }}>
            <AlertTriangle size={16} color={C.errorText} />
            <span style={{ fontSize: 13, color: C.errorText }}>{error}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <PrimaryBtn onClick={handleConfirm} disabled={loading}>
            {loading ? "Procesando..." : `Confirmar · $${dish.price.toFixed(2)}`}
          </PrimaryBtn>
          <button
            onClick={onBack}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 0", cursor: "pointer", fontFamily: "Inter, sans-serif", color: C.textSec, width: "100%" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: C.textSec }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: bold ? C.text : C.textSec }}>{value}</span>
    </div>
  );
}

// ─── PICKUP CODE ──────────────────────────────────────────────────────────────
function PickupCodeScreen({ order, onViewOrders, onBack }: { order: Order; onViewOrders: () => void; onBack: () => void }) {
  const digits = order.pickupCode.split("");

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 20px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={onBack} />
        <h3 style={{ margin: 0 }}>Código de retiro</h3>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        {/* Big circle */}
        <div style={{ width: 120, height: 120, borderRadius: "50%", background: C.orangeBg, border: `3px solid ${C.orange}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
          <span style={{ fontSize: 52 }}>🍽</span>
        </div>

        {/* El código se dicta de viva voz: no se escanea ni se muestra una
            pantalla al operador (decisión de Negocios del 28-jul-2026). */}
        <div style={{ fontSize: 14, color: C.textSec, marginBottom: 8, textAlign: "center" }}>Díctale este código al operador</div>

        {/* 6-digit code */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {digits.map((d, i) => (
            <div
              key={i}
              style={{
                width: 44, height: 54, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, color: C.text, fontFamily: "Inter, sans-serif",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10, textAlign: "center", maxWidth: 280 }}>
          6 dígitos numéricos. No se escanea nada: el operador lo teclea en su
          pantalla de validación.
        </div>

        <PendingBadge label="Regla de expiración del código (ej. válido por 4 horas) pendiente de definición" />

        <Card style={{ width: "100%", marginTop: 20, padding: "14px 16px" }}>
          <Row label="Orden" value={order.id} />
          <Row label="Plato" value={order.items[0]?.dishName} />
          <Row label="Monto" value={`$${order.total.toFixed(2)}`} />
          <Row label="Punto de entrega" value={`${order.items[0]?.localName} · Planta baja`} />
        </Card>
      </div>

      <div style={{ padding: "0 20px 32px" }}>
        <button
          onClick={onViewOrders}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 0", cursor: "pointer", fontFamily: "Inter, sans-serif", color: C.textSec, width: "100%", fontSize: 14 }}
        >
          Ver mis órdenes
        </button>
      </div>
    </div>
  );
}

// ─── RECHARGE ─────────────────────────────────────────────────────────────────
function RechargeScreen({ onBack }: { onBack: () => void }) {
  const { studentBalance, rechargeBalance } = useStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [method, setMethod] = useState<"card" | "transfer">("card");
  const amounts = [5, 10, 20, 30];
  const [done, setDone] = useState(false);

  function handleRecharge() {
    if (!selected) return;
    rechargeBalance(selected);
    setDone(true);
    setTimeout(() => { setDone(false); setSelected(null); }, 2000);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 20px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={onBack} />
        <h3 style={{ margin: 0 }}>Recargar saldo</h3>
      </div>

      <div style={{ padding: "20px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Balance */}
        <Card style={{ padding: "18px", textAlign: "center", background: C.orangeBg, border: `1px solid ${C.orange}` }}>
          <div style={{ fontSize: 13, color: C.orange, fontWeight: 600, marginBottom: 4 }}>Saldo actual</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.text }}>${studentBalance.toFixed(2)}</div>
          <PendingBadge label="¿El saldo se recarga en tiempo real o requiere confirmación bancaria? Pendiente de integración de pagos." />
        </Card>

        {/* Amount picker */}
        <Card style={{ padding: "16px" }}>
          <div style={{ fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 600 }}>Elige un monto</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {amounts.map((a) => (
              <button
                key={a}
                onClick={() => setSelected(a)}
                style={{
                  padding: "14px 0", borderRadius: 12,
                  border: `2px solid ${selected === a ? C.orange : C.border}`,
                  background: selected === a ? C.orangeBg : C.card,
                  color: selected === a ? C.orange : C.text,
                  fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 18, cursor: "pointer",
                }}
              >
                ${a}
              </button>
            ))}
          </div>
        </Card>

        {/* Method */}
        <Card style={{ padding: "16px" }}>
          <div style={{ fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 600 }}>Método de pago</div>
          {[
            { key: "card", label: "Tarjeta de crédito o débito", icon: "💳" },
            { key: "transfer", label: "Transferencia bancaria", icon: "🏦" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key as "card" | "transfer")}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 0",
                background: "none", border: "none", cursor: "pointer", borderBottom: `1px solid ${C.border}`, textAlign: "left",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.sunken, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {m.icon}
              </div>
              <span style={{ flex: 1, fontSize: 14, color: C.text, fontFamily: "Inter, sans-serif" }}>{m.label}</span>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${method === m.key ? C.orange : C.borderStrong}`, background: method === m.key ? C.orange : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {method === m.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
              </div>
            </button>
          ))}
        </Card>

        {done && (
          <div style={{ background: C.successBg, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 8, alignItems: "center" }}>
            <Check size={16} color={C.successText} />
            <span style={{ fontSize: 14, color: C.successText, fontWeight: 600 }}>¡Saldo recargado! Nuevo saldo: ${(studentBalance).toFixed(2)}</span>
          </div>
        )}

        <PrimaryBtn onClick={handleRecharge} disabled={!selected}>
          {selected ? `Recargar $${selected}` : "Selecciona un monto"}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
function OrdersScreen({ onShowCode }: { onShowCode: (order: Order) => void }) {
  const { orders } = useStore();

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 16px", background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ margin: 0 }}>Mis órdenes</h3>
      </div>

      <div style={{ padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        {orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14 }}>Aún no tienes órdenes</div>
          </div>
        )}
        {orders.map((o) => (
          <Card
            key={o.id}
            style={{ padding: "14px 16px", cursor: o.status === "pendiente" ? "pointer" : "default" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{o.items[0]?.dishName}</div>
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{o.items[0]?.localName}</div>
              </div>
              <StatusTag status={o.status} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 13, color: C.textMuted }}>{o.id}</span>
                {o.status === "pendiente" && (
                  <div style={{ fontSize: 11, color: C.orange, fontWeight: 600, marginTop: 2 }}>Código: {o.pickupCode}</div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: C.text }}>${o.total.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {o.createdAt.toLocaleDateString("es-EC", { day: "numeric", month: "short" })} {o.createdAt.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
            {o.status === "pendiente" && (
              <button
                onClick={() => onShowCode(o)}
                style={{ marginTop: 10, width: "100%", background: C.orangeBg, border: `1px solid ${C.orange}`, borderRadius: 10, padding: "8px 0", color: C.orange, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Ver código de retiro
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── CARTILLA ─────────────────────────────────────────────────────────────────
function CartillaScreen({ onRedeem }: { onRedeem: (localId: string) => void }) {
  const { loyaltyCards, locals, lastStamp, clearLastStamp } = useStore();

  // El sello recién acreditado se anima una sola vez: en cuanto termina la
  // animación se apaga la marca para que no se repita al volver a esta pestaña.
  useEffect(() => {
    if (!lastStamp) return;
    const t = setTimeout(clearLastStamp, 1400);
    return () => clearTimeout(t);
  }, [lastStamp, clearLastStamp]);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 16px", background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ margin: 0 }}>Mi cartilla</h3>
        <div style={{ fontSize: 13, color: C.textSec, marginTop: 4 }}>Acumula sellos con cada entrega confirmada</div>
      </div>

      <div style={{ padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
        {locals.map((local) => {
          const card = loyaltyCards[local.id];
          if (!card) return null;
          const isComplete = card.stampsEarned >= card.stampsRequired;
          const nuevoSello = lastStamp && lastStamp.localId === local.id ? lastStamp : null;
          return (
            <LoyaltyCardItem
              key={local.id}
              local={local}
              card={card}
              isComplete={isComplete}
              nuevoSello={nuevoSello}
              onRedeem={() => onRedeem(local.id)}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes selloLlenando {
          0%   { transform: scale(0.4); background: ${C.sunken}; border-color: ${C.border}; }
          55%  { transform: scale(1.28); background: ${C.orange}; border-color: ${C.orange}; }
          100% { transform: scale(1);    background: ${C.orange}; border-color: ${C.orange}; }
        }
        @keyframes selloCheck {
          0%, 35% { opacity: 0; transform: scale(0.2); }
          100%    { opacity: 1; transform: scale(1); }
        }
        @keyframes selloHalo {
          0%   { box-shadow: 0 0 0 0 rgba(224,84,35,0.55); }
          100% { box-shadow: 0 0 0 14px rgba(224,84,35,0); }
        }
      `}</style>
    </div>
  );
}

function LoyaltyCardItem({ local, card, isComplete, nuevoSello, onRedeem }: {
  local: Local;
  card: LoyaltyCardType;
  isComplete: boolean;
  nuevoSello: { localId: string; index: number; at: number } | null;
  onRedeem: () => void;
}) {
  const stamps = Array.from({ length: card.stampsRequired }, (_, i) => i < card.stampsEarned);

  return (
    <Card style={{ padding: "16px", overflow: "hidden", position: "relative" }}>
      {isComplete && (
        <div style={{ position: "absolute", top: 0, right: 0, background: C.orange, color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: "0 16px 0 12px" }}>
          COMPLETA ✓
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.orangeBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          {local.emoji}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{local.name}</div>
          <div style={{ fontSize: 12, color: C.textSec }}>{card.stampsEarned}/{card.stampsRequired} sellos</div>
        </div>
      </div>

      {/* Stamps grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {stamps.map((filled, i) => {
          const esNuevo = !!nuevoSello && nuevoSello.index === i && filled;
          return (
            <div
              // Incluir `at` en la key remonta el nodo en cada acreditación,
              // así la animación vuelve a dispararse aunque sea el mismo sello.
              key={esNuevo ? `${i}-${nuevoSello!.at}` : i}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: filled ? C.orange : C.sunken,
                border: `2px solid ${filled ? C.orange : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: esNuevo
                  ? "selloLlenando 0.55s cubic-bezier(0.34,1.56,0.64,1) both, selloHalo 0.9s ease-out 0.2s"
                  : "none",
              }}
            >
              {filled && (
                <Check
                  size={16}
                  color="#fff"
                  strokeWidth={3}
                  style={esNuevo ? { animation: "selloCheck 0.55s ease-out both" } : undefined}
                />
              )}
            </div>
          );
        })}
      </div>
      {nuevoSello && (
        <div style={{
          background: C.orangeBg, borderRadius: 10, padding: "8px 12px", marginBottom: 12,
          fontSize: 12, fontWeight: 600, color: C.orange,
        }}>
          + 1 sello acreditado al confirmarse tu entrega
        </div>
      )}

      <div style={{ background: C.sunken, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 2 }}>Premio</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{card.reward}</div>
      </div>

      <PendingBadge label="Cuántos sellos y qué premio ofrece este local está pendiente de negociación con el proveedor." />

      {isComplete && (
        <PrimaryBtn onClick={onRedeem} style={{ marginTop: 12 }}>
          ¡Canjear premio!
        </PrimaryBtn>
      )}
    </Card>
  );
}

// ─── REDEEM REWARD ────────────────────────────────────────────────────────────
function RedeemRewardScreen({ localId, onBack, onSuccess }: { localId: string; onBack: () => void; onSuccess: (order: Order) => void }) {
  const store = useStore();
  const local = store.locals.find((l) => l.id === localId)!;
  const card = store.loyaltyCards[localId];
  const [done, setDone] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRedeem() {
    const result = store.redeemLoyalty(localId);
    if (result.success && result.order) {
      setOrder(result.order);
      setDone(true);
    } else {
      setError(result.error || "Error al canjear");
    }
  }

  if (done && order) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: C.pageBg }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Check size={36} color={C.successText} />
        </div>
        <h2 style={{ textAlign: "center", color: C.text, marginBottom: 8 }}>¡Premio canjeado!</h2>
        <p style={{ textAlign: "center", fontSize: 14, color: C.textSec, marginBottom: 24 }}>
          Se creó una orden de $0.00. Muestra el código al operador para recibir tu premio.
        </p>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.orange, letterSpacing: 4, marginBottom: 24 }}>
          {order.pickupCode}
        </div>
        <PrimaryBtn onClick={() => onSuccess(order)}>Ver código de retiro</PrimaryBtn>
        <button onClick={onBack} style={{ marginTop: 10, background: "none", border: "none", color: C.textSec, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Volver a cartilla</button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 20px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={onBack} />
        <h3 style={{ margin: 0 }}>Canjear premio</h3>
      </div>

      <div style={{ padding: "24px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 56 }}>{local.emoji}</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginTop: 8 }}>{card?.reward}</div>
          <div style={{ fontSize: 13, color: C.textSec, marginTop: 4 }}>{local.name}</div>
        </div>

        <Card style={{ padding: "16px" }}>
          <Row label="Local" value={local.name} />
          <Row label="Sellos completados" value={`${card?.stampsEarned}/${card?.stampsRequired}`} />
          <Row label="Precio del premio" value="$0.00" bold />
        </Card>

        <div style={{ background: C.infoBg, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 8 }}>
          <Info size={16} color={C.infoText} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: C.infoText, lineHeight: 1.5 }}>
            Se generará una orden real de $0.00. Se descuenta inventario pero <strong>no se descuenta saldo</strong>. La cartilla se reiniciará a 0.
          </span>
        </div>

        {error && (
          <div style={{ background: C.errorBg, borderRadius: 12, padding: "12px 14px" }}>
            <span style={{ fontSize: 13, color: C.errorText }}>{error}</span>
          </div>
        )}

        <PrimaryBtn onClick={handleRedeem}>Confirmar canje · $0.00</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const { studentBalance, studentName } = useStore();

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 20px", background: C.orange }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>{studentName}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>ana.martinez@universidad.edu.ec</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Card style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: C.textSec }}>Saldo disponible</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>${studentBalance.toFixed(2)}</div>
          </div>
          <CreditCard size={28} color={C.orange} />
        </Card>

        {[
          { icon: "🔔", label: "Notificaciones" },
          { icon: "🔒", label: "Privacidad y seguridad" },
          { icon: "❓", label: "Ayuda y soporte" },
          { icon: "📄", label: "Términos y condiciones" },
        ].map((item) => (
          <Card key={item.label} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: C.text }}>{item.label}</span>
              <ChevronRight size={16} color={C.textMuted} />
            </div>
          </Card>
        ))}

        <button
          onClick={onLogout}
          style={{ marginTop: 8, background: C.errorBg, border: "none", borderRadius: 12, padding: "14px 0", cursor: "pointer", color: C.errorText, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, width: "100%" }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─── TAB BAR ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: StudentTab; onChange: (t: StudentTab) => void }) {
  const tabs: { id: StudentTab; label: string; icon: React.ReactNode }[] = [
    { id: "menu", label: "Menú", icon: <UtensilsCrossed size={22} /> },
    { id: "cartilla", label: "Cartilla", icon: <BookOpen size={22} /> },
    { id: "ordenes", label: "Órdenes", icon: <ClipboardList size={22} /> },
    { id: "perfil", label: "Perfil", icon: <User size={22} /> },
  ];

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", height: 64, paddingBottom: 8 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 2, border: "none", background: "none", cursor: "pointer",
            color: active === t.id ? C.orange : C.textMuted,
          }}
        >
          {t.icon}
          <span style={{ fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: active === t.id ? 600 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── MAIN STUDENT APP ─────────────────────────────────────────────────────────
export function StudentApp() {
  const { studentLoggedIn, studentLogin } = useStore();
  const [activeTab, setActiveTab] = useState<StudentTab>("menu");
  const [screen, setScreen] = useState<StudentScreen>({ name: "menu" });

  if (!studentLoggedIn) return <LoginScreen onLogin={studentLogin} />;

  function handleTabChange(tab: StudentTab) {
    setActiveTab(tab);
    setScreen({ name: tab as any });
  }

  function renderScreen() {
    switch (screen.name) {
      case "menu":
        return (
          <MenuScreen
            onDishTap={(dish) => setScreen({ name: "dish-detail", dish })}
            onRecharge={() => setScreen({ name: "recharge" })}
          />
        );
      case "dish-detail":
        return (
          <DishDetailScreen
            dish={(screen as any).dish}
            onBack={() => setScreen({ name: "menu" })}
            onConfirm={() => setScreen({ name: "confirm-purchase", dish: (screen as any).dish })}
          />
        );
      case "confirm-purchase":
        return (
          <ConfirmPurchaseScreen
            dish={(screen as any).dish}
            onBack={() => setScreen({ name: "dish-detail", dish: (screen as any).dish })}
            onPurchase={(order) => setScreen({ name: "pickup-code", order })}
          />
        );
      case "pickup-code":
        return (
          <PickupCodeScreen
            order={(screen as any).order}
            onViewOrders={() => { setActiveTab("ordenes"); setScreen({ name: "ordenes" }); }}
            onBack={() => { setActiveTab("ordenes"); setScreen({ name: "ordenes" }); }}
          />
        );
      case "recharge":
        return <RechargeScreen onBack={() => setScreen({ name: "menu" })} />;
      case "ordenes":
        return (
          <OrdersScreen
            onShowCode={(order) => setScreen({ name: "pickup-code", order })}
          />
        );
      case "cartilla":
        return <CartillaScreen onRedeem={(localId) => setScreen({ name: "redeem-reward", localId })} />;
      case "redeem-reward":
        return (
          <RedeemRewardScreen
            localId={(screen as any).localId}
            onBack={() => setScreen({ name: "cartilla" })}
            onSuccess={(order) => setScreen({ name: "pickup-code", order })}
          />
        );
      case "perfil":
        return <ProfileScreen onLogout={() => setLoggedIn(false)} />;
      default:
        return <MenuScreen onDishTap={(dish) => setScreen({ name: "dish-detail", dish })} onRecharge={() => setScreen({ name: "recharge" })} />;
    }
  }

  const showTabs = !["dish-detail", "confirm-purchase", "pickup-code", "recharge", "redeem-reward"].includes(screen.name);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: showTabs ? 64 : 0 }}>
        {renderScreen()}
      </div>
      {showTabs && <TabBar active={activeTab} onChange={handleTabChange} />}
    </div>
  );
}
