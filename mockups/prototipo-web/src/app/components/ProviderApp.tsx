import { useState, useMemo } from "react";
import {
  BarChart2, UtensilsCrossed, Database, Award,
  Plus, Minus, AlertTriangle, Check, RefreshCw,
  X, Save, TrendingUp, Package,
  Clock, ShoppingBag, AlertCircle,
} from "lucide-react";
import { useStore, MenuItem, ERPEvent, Order } from "../store";

// ─── Tokens ───────────────────────────────────────────────────────────────────
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

type ProviderTab = "panel" | "menu" | "erp" | "fidelidad";
const LOCAL_ID = "baru"; // This provider manages Barú

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" });
}

/** Orders that belong to this local */
function localOrders(orders: Order[], localId: string) {
  return orders.filter((o) => o.items.some((i) => i.localId === localId));
}

/** Orders created today for this local */
function todayOrders(orders: Order[], localId: string) {
  const today = todayISO();
  return localOrders(orders, localId).filter(
    (o) => o.createdAt.toISOString().split("T")[0] === today
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function PendingBadge({ label }: { label: string }) {
  return (
    <div style={{ background: C.warnBg, borderRadius: 10, padding: "8px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
      <AlertTriangle size={13} color={C.warnText} style={{ marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: C.warnText, lineHeight: 1.5 }}>
        <strong>Pendiente de Negocios:</strong> {label}
      </span>
    </div>
  );
}

function Pill({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ color, background: bg, borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "2px 9px", display: "inline-block", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44, height: 26, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0,
        background: on ? C.orange : C.borderStrong,
        position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        left: on ? 21 : 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

const adjBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`,
  background: C.sunken, cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center", color: C.text, flexShrink: 0,
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function ProviderLogin({ onLogin }: { onLogin: () => void }) {
  const { providerLogin } = useStore();
  const [user, setUser] = useState("admin@baru.com.ec");
  const [pass, setPass] = useState("12345678");
  const [error, setError] = useState(false);

  function handleLogin() {
    if (providerLogin(user, pass)) {
      onLogin();
    } else {
      setError(true);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.pageBg }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", gap: 28 }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: `linear-gradient(145deg, ${C.orange}, #C03A12)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(224,84,35,0.35)", fontSize: 30,
          }}>🍽</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 22, color: C.text }}>Panel del local</div>
            <div style={{ fontSize: 13, color: C.textSec, marginTop: 3 }}>Acceso para Proveedores</div>
          </div>
        </div>

        {/* Form */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
          <FieldRow label="Usuario">
            <input value={user} onChange={(e) => { setUser(e.target.value); setError(false); }}
              style={inputSt} autoCapitalize="none" />
          </FieldRow>
          <FieldRow label="Contraseña">
            <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError(false); }}
              style={inputSt} />
          </FieldRow>

          {error && (
            <div style={{ background: C.errorBg, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.errorText, display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={14} /> Usuario o contraseña incorrectos
            </div>
          )}

          <button onClick={handleLogin} style={primaryBtnSt}>Ingresar</button>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
          Credenciales propias del rol, no institucionales (UCId).<br />
          Cada local administra sus propias cuentas.
        </div>
      </div>
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: "100%", padding: "13px 14px", borderRadius: 12,
  border: `1.5px solid ${C.border}`, fontFamily: "Inter, sans-serif",
  fontSize: 15, color: C.text, background: C.card, outline: "none",
  boxSizing: "border-box",
};

const primaryBtnSt: React.CSSProperties = {
  background: C.orange, color: "#fff", border: "none", borderRadius: 14,
  padding: "16px 0", cursor: "pointer", fontFamily: "Inter, sans-serif",
  fontWeight: 700, fontSize: 16, width: "100%",
  boxShadow: "0 4px 16px rgba(224,84,35,0.3)",
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>{label}</label>
      {children}
    </div>
  );
}

// ─── PANEL TAB ────────────────────────────────────────────────────────────────
function PanelTab() {
  const { orders, menu } = useStore();

  // ── Computed metrics from real state ──────────────────────────────────────
  const allLocal   = useMemo(() => localOrders(orders, LOCAL_ID), [orders]);
  const todayLocal = useMemo(() => todayOrders(orders, LOCAL_ID), [orders]);

  const ventasHoy   = todayLocal.length;
  const ingresosHoy = todayLocal
    .filter((o) => o.status !== "pendiente")
    .reduce((s, o) => s + o.total, 0);
  const entregadasHoy = todayLocal.filter((o) => o.status === "entregado" || o.status === "canjeado").length;
  const pendientesHoy = todayLocal.filter((o) => o.status === "pendiente").length;
  const ticketProm    = entregadasHoy > 0 ? ingresosHoy / entregadasHoy : 0;

  // Dish ranking from all local orders (all time, today-relevant in practice)
  const dishCount = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    allLocal.forEach((o) => o.items.forEach((i) => {
      if (!map[i.dishId]) map[i.dishId] = { name: i.dishName, count: 0, revenue: 0 };
      map[i.dishId].count   += i.quantity;
      map[i.dishId].revenue += i.price * i.quantity;
    }));
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [allLocal]);

  const maxCount = dishCount[0]?.count ?? 1;

  // Stock alerts
  const lowStock  = menu.filter((m) => m.localId === LOCAL_ID && m.published && m.stock > 0 && m.stock <= 2);
  const zeroStock = menu.filter((m) => m.localId === LOCAL_ID && m.published && m.stock === 0);

  // Recent orders (last 5)
  const recent = [...allLocal].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

  const dateLabel = new Date().toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(160deg, ${C.orange} 0%, ${C.orangeLight} 100%)`, padding: "48px 20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", textTransform: "capitalize" }}>{dateLabel}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginTop: 4, letterSpacing: -0.5 }}>Barú</div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "Inter, sans-serif",
          }}>JJ</div>
        </div>

        {/* Big revenue */}
        <div style={{ marginTop: 16, background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>INGRESOS HOY</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>
            ${ingresosHoy.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
            {entregadasHoy} orden{entregadasHoy !== 1 ? "es" : ""} entregada{entregadasHoy !== 1 ? "s" : ""}
          </div>
          <PendingBadgeInline label="Modelo de cobro de Aliflow al proveedor pendiente de definición comercial." />
        </div>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── KPI row ────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <KpiCard
            icon={<ShoppingBag size={16} color={C.orange} />}
            label="Ventas hoy"
            value={String(ventasHoy)}
            bg={C.orangeBg}
          />
          <KpiCard
            icon={<Check size={16} color={C.successText} />}
            label="Entregadas"
            value={String(entregadasHoy)}
            bg={C.successBg}
          />
          <KpiCard
            icon={<Clock size={16} color={pendientesHoy > 0 ? C.warnText : C.textMuted} />}
            label="Pendientes"
            value={String(pendientesHoy)}
            bg={pendientesHoy > 0 ? C.warnBg : C.sunken}
            highlight={pendientesHoy > 0}
          />
        </div>

        {/* Ticket promedio */}
        <Card style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.infoBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={18} color={C.infoText} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.textSec }}>Ticket promedio hoy</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
              {ticketProm > 0 ? `$${ticketProm.toFixed(2)}` : "—"}
            </div>
          </div>
          {entregadasHoy === 0 && (
            <span style={{ fontSize: 11, color: C.textMuted }}>Sin entregas aún</span>
          )}
        </Card>

        {/* ── Stock alerts ───────────────────────────────────────────── */}
        {(zeroStock.length > 0 || lowStock.length > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SectionTitle>Alertas de inventario</SectionTitle>
            {zeroStock.map((d) => (
              <div key={d.id} style={{ background: C.errorBg, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                <Package size={14} color={C.errorText} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: C.errorText, fontWeight: 600 }}>{d.name}</span>
                <Pill color={C.errorText} bg="#fff">Agotado</Pill>
              </div>
            ))}
            {lowStock.map((d) => (
              <div key={d.id} style={{ background: C.warnBg, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                <Package size={14} color={C.warnText} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: C.warnText, fontWeight: 600 }}>{d.name}</span>
                <Pill color={C.warnText} bg="#fff">{d.stock} disp.</Pill>
              </div>
            ))}
          </div>
        )}

        {/* ── Dish ranking ──────────────────────────────────────────── */}
        <div>
          <SectionTitle>Platos más pedidos</SectionTitle>
          <Card style={{ padding: "14px 16px" }}>
            {dishCount.length === 0 ? (
              <div style={{ fontSize: 13, color: C.textMuted, padding: "8px 0", textAlign: "center" }}>
                Sin órdenes todavía
              </div>
            ) : (
              dishCount.slice(0, 5).map((d, i) => (
                <div key={d.name} style={{ marginBottom: i < dishCount.length - 1 ? 12 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: 999,
                        background: i === 0 ? C.orange : C.sunken,
                        color: i === 0 ? "#fff" : C.textMuted,
                        fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{d.count}</span>
                  </div>
                  {/* Bar */}
                  <div style={{ height: 4, borderRadius: 99, background: C.sunken, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      background: i === 0 ? C.orange : C.borderStrong,
                      width: `${Math.round((d.count / maxCount) * 100)}%`,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* ── Recent orders ─────────────────────────────────────────── */}
        <div>
          <SectionTitle>Órdenes recientes</SectionTitle>
          {recent.length === 0 ? (
            <Card style={{ padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: C.textMuted }}>Sin órdenes en el sistema todavía</div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.map((o) => (
                <RecentOrderRow key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function PendingBadgeInline({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 8 }}>
      <AlertTriangle size={12} color="rgba(255,255,255,0.8)" style={{ marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
        <strong>Pendiente de Negocios:</strong> {label}
      </span>
    </div>
  );
}

function KpiCard({ icon, label, value, bg, highlight }: {
  icon: React.ReactNode; label: string; value: string; bg: string; highlight?: boolean;
}) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: "12px 12px 10px", border: `1px solid ${highlight ? C.warnText : C.border}` }}>
      <div style={{ marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textSec, marginTop: 4, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function RecentOrderRow({ order }: { order: Order }) {
  const statusMap = {
    pendiente: { label: "Pendiente", color: C.warnText, bg: C.warnBg },
    listo:     { label: "Listo",     color: C.infoText, bg: C.infoBg },
    entregado: { label: "Entregado", color: C.successText, bg: C.successBg },
    canjeado:  { label: "Canjeado",  color: C.successText, bg: C.successBg },
  };
  const st = statusMap[order.status];
  return (
    <Card style={{ padding: "11px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {order.items[0]?.dishName ?? "—"}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            {order.id} · {fmtTime(order.createdAt)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginLeft: 8 }}>
          <Pill color={st.color} bg={st.bg}>{st.label}</Pill>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>${order.total.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}

// ─── MENU TAB ─────────────────────────────────────────────────────────────────
function MenuTab() {
  const { menu, orders, updateStock, togglePublished } = useStore();
  const baruMenu = menu.filter((m) => m.localId === LOCAL_ID);
  const today = new Date().toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "short" });

  // How many of each dish were sold today
  const soldToday = useMemo(() => {
    const map: Record<string, number> = {};
    todayOrders(orders, LOCAL_ID).forEach((o) =>
      o.items.forEach((i) => { map[i.dishId] = (map[i.dishId] ?? 0) + i.quantity; })
    );
    return map;
  }, [orders]);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, paddingBottom: 20 }}>
      <div style={{ padding: "48px 16px 14px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>Menú del día</div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 2, textTransform: "capitalize" }}>Barú · {today}</div>
        </div>
        <button style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
          <Plus size={14} /> Plato
        </button>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: C.warnBg, borderRadius: 10, padding: "9px 12px", fontSize: 11, color: C.warnText, lineHeight: 1.5 }}>
          Antes de publicar valida: nombre no vacío, precio &gt; 0 y stock &gt; 0. Sin estas condiciones el plato no aparece a los estudiantes.
        </div>

        {baruMenu.map((dish) => (
          <MenuDishCard
            key={dish.id}
            dish={dish}
            soldToday={soldToday[dish.id] ?? 0}
            onStockChange={(d) => updateStock(dish.id, d)}
            onToggle={() => togglePublished(dish.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MenuDishCard({ dish, soldToday, onStockChange, onToggle }: {
  dish: MenuItem; soldToday: number; onStockChange: (d: number) => void; onToggle: () => void;
}) {
  return (
    <Card style={{ padding: "14px 16px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: C.orangeBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {dish.imageEmoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{dish.name}</div>
          <div style={{ fontSize: 12, color: C.textSec }}>${dish.price.toFixed(2)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <Toggle on={dish.published} onToggle={onToggle} />
          <span style={{ fontSize: 10, color: dish.published ? C.successText : C.textMuted, fontWeight: 600 }}>
            {dish.published ? "Publicado" : "Oculto"}
          </span>
        </div>
      </div>

      {/* Stock + sold row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => onStockChange(-1)} style={adjBtn}><Minus size={14} /></button>
          <div style={{ textAlign: "center", minWidth: 40 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: dish.stock === 0 ? C.errorText : C.text, lineHeight: 1 }}>{dish.stock}</div>
            <div style={{ fontSize: 9, color: C.textMuted }}>en stock</div>
          </div>
          <button onClick={() => onStockChange(1)} style={{ ...adjBtn, background: C.orange, border: "none" }}>
            <Plus size={14} color="#fff" />
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: C.border }} />

        {/* Sold today */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.orange, lineHeight: 1 }}>{soldToday}</div>
          <div style={{ fontSize: 9, color: C.textMuted }}>vendidos hoy</div>
        </div>
      </div>

      {/* Alerts */}
      {dish.stock === 0 && dish.published && (
        <div style={{ marginTop: 10, background: C.errorBg, borderRadius: 8, padding: "6px 10px", fontSize: 11, color: C.errorText, fontWeight: 600 }}>
          ⚠ Sin stock — oculto automáticamente para estudiantes
        </div>
      )}
      {dish.stock > 0 && dish.stock <= 2 && (
        <div style={{ marginTop: 10, background: C.warnBg, borderRadius: 8, padding: "6px 10px", fontSize: 11, color: C.warnText }}>
          ⚡ Pocas unidades — considera aumentar el stock
        </div>
      )}
    </Card>
  );
}

// ─── ERP TAB ──────────────────────────────────────────────────────────────────
function ERPTab() {
  const { erpEvents } = useStore();
  const [forcing, setForcing] = useState(false);

  const synced  = erpEvents.filter((e) => e.status === "sincronizado").length;
  const errors  = erpEvents.filter((e) => e.status === "error").length;
  const pending = erpEvents.filter((e) => e.status === "pendiente").length;

  const lastOk = erpEvents.find((e) => e.status === "sincronizado");

  function handleForce() {
    setForcing(true);
    setTimeout(() => setForcing(false), 1500);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, paddingBottom: 20 }}>
      <div style={{ padding: "48px 16px 14px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>Sincronización ERP</div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Barú · integración con Contifico</div>
        </div>
        <button
          onClick={handleForce}
          style={{ background: forcing ? C.borderStrong : C.orange, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 5, transition: "background 0.2s" }}
        >
          <RefreshCw size={14} style={{ animation: forcing ? "spin 0.8s linear infinite" : "none" }} />
          {forcing ? "Forzando…" : "Forzar"}
        </button>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Connection status */}
        <Card style={{ padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Contifico</div>
              <div style={{ fontSize: 12, color: C.textSec }}>API #1 · ConticoAdapter</div>
            </div>
            <Pill color={errors > 0 ? C.errorText : C.successText} bg={errors > 0 ? C.errorBg : C.successBg}>
              {errors > 0 ? `● ${errors} error${errors > 1 ? "es" : ""}` : "● Sincronizado"}
            </Pill>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { label: "Última sincronización OK", value: lastOk ? `Hoy ${fmtTime(lastOk.timestamp)}` : "—" },
              { label: "Sentido", value: "Bidireccional" },
              { label: "Frecuencia", value: "Polling cada 5 min" },
              { label: "Eventos en cola", value: `${erpEvents.length} total · ${pending} pendiente${pending !== 1 ? "s" : ""} · ${errors} error${errors !== 1 ? "es" : ""}` },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 12, color: C.textSec, flexShrink: 0 }}>{r.label}</span>
                <span style={{ fontSize: 12, color: C.text, fontWeight: 500, textAlign: "right" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Counter chips */}
        <div style={{ display: "flex", gap: 8 }}>
          <ChipCount label="Sincronizados" value={synced} color={C.successText} bg={C.successBg} />
          <ChipCount label="Pendientes"    value={pending} color={C.warnText}    bg={C.warnBg}    />
          <ChipCount label="Errores"       value={errors}  color={C.errorText}   bg={C.errorBg}   />
        </div>

        {/* Event list */}
        <SectionTitle>Cola de eventos (Patrón Outbox)</SectionTitle>
        {erpEvents.slice(0, 10).map((evt) => (
          <ERPEventCard key={evt.id} event={evt} />
        ))}

        {/* Technical note */}
        <Card style={{ padding: "14px 16px", background: C.infoBg, border: `1px solid ${C.infoText}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.infoText, marginBottom: 5 }}>Arquitectura de integración</div>
          <div style={{ fontSize: 12, color: C.infoText, lineHeight: 1.6 }}>
            Ningún ERP del alcance expone webhooks: la integración es <em>pull</em>. Aliflow implementa el Patrón Outbox: las ventas se escriben en una cola durable antes de enviarse al ERP, por lo que <strong>una venta no se pierde aunque el ERP esté caído</strong>.
          </div>
        </Card>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ChipCount({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 12, padding: "10px 10px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function ERPEventCard({ event }: { event: ERPEvent }) {
  const map = {
    sincronizado: { label: "Completado",   color: C.successText, bg: C.successBg, Icon: Check },
    pendiente:    { label: "Pendiente",    color: C.warnText,    bg: C.warnBg,    Icon: RefreshCw },
    error:        { label: "Error de sync",color: C.errorText,   bg: C.errorBg,   Icon: X },
  };
  const s = map[event.status];
  return (
    <Card style={{ padding: "11px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{event.type} · Hoy {fmtTime(event.timestamp)}</div>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.payload}</div>
        </div>
        <Pill color={s.color} bg={s.bg}>{s.label}</Pill>
      </div>
    </Card>
  );
}

// ─── FIDELIDAD TAB ────────────────────────────────────────────────────────────
function LoyaltyTab() {
  const { loyaltyCards, updateLoyaltyConfig, orders } = useStore();
  const card = loyaltyCards[LOCAL_ID];

  // Form state initialised from store (not stale: re-reads on each mount)
  const [stamps,    setStamps]    = useState(() => card?.stampsRequired  ?? 8);
  const [reward,    setReward]    = useState(() => card?.reward          ?? "Un almuerzo del día gratis");
  const [maxPerDay, setMaxPerDay] = useState(() => card?.maxStampsPerDay ?? 1);
  const [expiry,    setExpiry]    = useState(() => card?.expiryDays      ?? 90);
  const [saved,     setSaved]     = useState(false);

  // Students who completed cartilla: count canje orders
  const canjesCount = orders.filter((o) => o.isRedemption && o.items[0]?.localId === LOCAL_ID).length;
  const stampsGiven = orders.filter(
    (o) => !o.isRedemption && (o.status === "entregado") && o.items[0]?.localId === LOCAL_ID
  ).length;

  function handleSave() {
    updateLoyaltyConfig(LOCAL_ID, { stampsRequired: stamps, reward, maxStampsPerDay: maxPerDay, expiryDays: expiry });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const previewFilled = Math.min(card?.stampsEarned ?? 0, stamps);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.pageBg, paddingBottom: 20 }}>
      <div style={{ padding: "48px 16px 14px", background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>Programa de fidelidad</div>
        <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Barú · configuración de este local</div>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <PendingBadge label="El negocio no ha definido todavía los parámetros de sellos y premios. Esta pantalla permite al proveedor configurarlo antes de activarlo." />

        {/* Activity summary */}
        <div style={{ display: "flex", gap: 8 }}>
          <ChipCount label="Sellos entregados" value={stampsGiven} color={C.orange}       bg={C.orangeBg}   />
          <ChipCount label="Premios canjeados" value={canjesCount} color={C.successText}  bg={C.successBg}  />
        </div>

        {/* Config card */}
        <Card style={{ padding: "16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, letterSpacing: 0.4, marginBottom: 14 }}>CONFIGURACIÓN ACTIVA</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FormRow label="Sellos para completar la cartilla">
              <Stepper value={stamps} min={1} max={20} onChange={setStamps} />
            </FormRow>

            <FormRow label="Premio">
              <input
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                style={{ ...inputSt, fontSize: 14, padding: "10px 12px" }}
              />
            </FormRow>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <FormRow label="Máx. sellos/día">
                  <Stepper value={maxPerDay} min={1} max={5} onChange={setMaxPerDay} />
                </FormRow>
              </div>
              <div style={{ flex: 1 }}>
                <FormRow label="Caducidad (días)">
                  <Stepper value={expiry} min={30} max={365} step={30} onChange={setExpiry} />
                </FormRow>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, letterSpacing: 0.4, marginBottom: 12 }}>VISTA PREVIA — cómo ve el estudiante</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            Barú · {previewFilled}/{stamps} sellos
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
            {Array.from({ length: stamps }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i < previewFilled ? C.orange : C.sunken,
                  border: `2px solid ${i < previewFilled ? C.orange : C.borderStrong}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i < previewFilled && <Check size={12} color="#fff" strokeWidth={3} />}
              </div>
            ))}
          </div>
          <div style={{ background: C.sunken, borderRadius: 9, padding: "8px 10px" }}>
            <div style={{ fontSize: 11, color: C.textMuted }}>Premio</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{reward || "—"}</div>
          </div>
        </Card>

        {/* How stamps work */}
        <Card style={{ padding: "14px 16px", background: C.infoBg, border: `1px solid ${C.infoText}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.infoText, marginBottom: 6 }}>Cómo se acreditan los sellos</div>
          <div style={{ fontSize: 12, color: C.infoText, lineHeight: 1.6 }}>
            El operador confirma la entrega → Aliflow acredita 1 sello al comprador.<br />
            Máx. <strong>{maxPerDay} sello{maxPerDay > 1 ? "s" : ""} por día</strong> · Caducidad: <strong>{expiry} días</strong> · Al canjear se genera una orden real de $0.00.
          </div>
        </Card>

        {saved && (
          <div style={{ background: C.successBg, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 8, alignItems: "center" }}>
            <Check size={15} color={C.successText} />
            <span style={{ fontSize: 13, color: C.successText, fontWeight: 600 }}>Programa guardado correctamente</span>
          </div>
        )}

        <button onClick={handleSave} style={primaryBtnSt}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Save size={16} /> Guardar programa
          </span>
        </button>
      </div>
    </div>
  );
}

function Stepper({ value, min, max, step = 1, onChange }: {
  value: number; min: number; max: number; step?: number; onChange: (n: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={() => onChange(Math.max(min, value - step))} style={adjBtn}><Minus size={14} /></button>
      <span style={{ fontWeight: 800, fontSize: 20, color: C.text, minWidth: 36, textAlign: "center" }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} style={{ ...adjBtn, background: C.orange, border: "none" }}>
        <Plus size={14} color="#fff" />
      </button>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

// ─── TAB BAR ──────────────────────────────────────────────────────────────────
function ProviderTabBar({ active, onChange, pendingOrders }: {
  active: ProviderTab; onChange: (t: ProviderTab) => void; pendingOrders: number;
}) {
  const tabs: { id: ProviderTab; label: string; icon: (active: boolean) => React.ReactNode; badge?: boolean }[] = [
    { id: "panel",    label: "Panel",    icon: (a) => <BarChart2 size={22} strokeWidth={a ? 2.5 : 1.8} />, badge: pendingOrders > 0 },
    { id: "menu",     label: "Menú",     icon: (a) => <UtensilsCrossed size={22} strokeWidth={a ? 2.5 : 1.8} /> },
    { id: "erp",      label: "ERP",      icon: (a) => <Database size={22} strokeWidth={a ? 2.5 : 1.8} /> },
    { id: "fidelidad",label: "Fidelidad",icon: (a) => <Award size={22} strokeWidth={a ? 2.5 : 1.8} /> },
  ];

  return (
    <div style={{
      background: C.card, borderTop: `1px solid ${C.border}`,
      display: "flex", height: 64, paddingBottom: 6, flexShrink: 0,
    }}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 3, border: "none", background: "none",
              cursor: "pointer", color: isActive ? C.orange : C.textMuted,
              position: "relative",
            }}
          >
            {t.icon(isActive)}
            <span style={{ fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: isActive ? 700 : 400 }}>
              {t.label}
            </span>
            {t.badge && (
              <span style={{
                position: "absolute", top: 6, right: "calc(50% - 14px)",
                width: 8, height: 8, borderRadius: "50%",
                background: C.orange, border: `2px solid ${C.card}`,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function ProviderApp() {
  const [activeTab, setActiveTab] = useState<ProviderTab>("panel");
  const { orders, providerLoggedIn, providerLogout } = useStore();

  const pendingOrders = useMemo(
    () => todayOrders(orders, LOCAL_ID).filter((o) => o.status === "pendiente").length,
    [orders]
  );

  function handleLogout() {
    providerLogout();
  }

  if (!providerLoggedIn) return <ProviderLogin onLogin={() => { /* providerLogin ya marcó la sesión */ }} />;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "panel"     && <PanelTab />}
        {activeTab === "menu"      && <MenuTab />}
        {activeTab === "erp"       && <ERPTab />}
        {activeTab === "fidelidad" && <LoyaltyTab />}
      </div>
      <ProviderTabBar active={activeTab} onChange={setActiveTab} pendingOrders={pendingOrders} />
    </div>
  );
}
