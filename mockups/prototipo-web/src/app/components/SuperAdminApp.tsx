import { useState } from "react";
import {
  Building2, LifeBuoy, Settings, Plus, Check, X,
  ShieldCheck, Database, AlertTriangle,
} from "lucide-react";
import { useStore, Local } from "../store";
import { C } from "../tokens";
import { AliflowLogoMark } from "./AliflowLogo";


type Tab = "locales" | "soporte" | "plataforma";

// ─── Primitivas ───────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, ...style }}>
      {children}
    </div>
  );
}

function PendingBadge({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", gap: 8, background: C.warnBg, borderRadius: 10, padding: "10px 12px", alignItems: "flex-start" }}>
      <AlertTriangle size={14} color={C.warnText} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 11, color: C.warnText, lineHeight: 1.45 }}>
        <strong>Pendiente de Negocios:</strong> {label}
      </span>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function SuperAdminLogin() {
  const { superAdminLogin } = useStore();
  const [user, setUser] = useState("soporte@aliflow.ec");
  const [pass, setPass] = useState("12345678");
  const [error, setError] = useState(false);

  function handle() {
    if (!superAdminLogin(user, pass)) setError(true);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px", background: C.pageBg }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <div style={{ position: "relative", marginBottom: 20 }}>
          <AliflowLogoMark size={84} fondo={C.admin} sobreOscuro />
          <div style={{
            position: "absolute", right: -6, bottom: -6, width: 32, height: 32,
            borderRadius: 999, background: "#fff", border: `2px solid ${C.admin}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={17} color={C.admin} strokeWidth={2.4} />
          </div>
        </div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text }}>Aliflow Admin</h2>
        <div style={{ fontSize: 13, color: C.textSec, marginTop: 6, textAlign: "center", maxWidth: 280 }}>
          Administración de la plataforma. Acceso solo para el equipo de Aliflow.
        </div>
      </div>

      <label style={{ fontSize: 12, color: C.textSec, marginBottom: 6 }}>Usuario</label>
      <input
        value={user}
        onChange={(e) => { setUser(e.target.value); setError(false); }}
        style={{
          padding: "14px 16px", borderRadius: 12, border: `1px solid ${error ? C.errorText : C.borderStrong}`,
          fontSize: 15, marginBottom: 14, fontFamily: "Inter, sans-serif", background: C.card,
        }}
      />
      <label style={{ fontSize: 12, color: C.textSec, marginBottom: 6 }}>Contraseña</label>
      <input
        type="password"
        value={pass}
        onChange={(e) => { setPass(e.target.value); setError(false); }}
        style={{
          padding: "14px 16px", borderRadius: 12, border: `1px solid ${error ? C.errorText : C.borderStrong}`,
          fontSize: 15, marginBottom: 20, fontFamily: "Inter, sans-serif", background: C.card,
        }}
      />
      <button
        onClick={handle}
        style={{
          background: C.admin, color: "#fff", border: "none", borderRadius: 14,
          padding: "16px 0", fontSize: 16, fontWeight: 700, cursor: "pointer",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Ingresar
      </button>
      <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
        Cuarto rol, acordado en la reunión del 30-jul-2026.
        <br />Es el único rol con visibilidad sobre todos los locales.
      </div>
    </div>
  );
}

// ─── Locales ──────────────────────────────────────────────────────────────────
function LocalesTab() {
  const { locals, menu, orders, altaLocal, toggleLocalActivo } = useStore();
  const [abriendo, setAbriendo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [desc, setDesc] = useState("");

  function crear() {
    if (!nombre.trim()) return;
    altaLocal(nombre.trim(), desc.trim() || "Local nuevo", "🍽");
    setNombre(""); setDesc(""); setAbriendo(false);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Locales</h3>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{locals.length} organizaciones en la plataforma</div>
        </div>
        <button
          onClick={() => setAbriendo((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6, background: abriendo ? C.sunken : C.admin,
            color: abriendo ? C.text : "#fff", border: "none", borderRadius: 999,
            padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}
        >
          {abriendo ? <X size={14} /> : <Plus size={14} />}
          {abriendo ? "Cancelar" : "Dar de alta"}
        </button>
      </div>

      {abriendo && (
        <Card style={{ borderColor: C.admin, background: C.adminBg }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.admin, marginBottom: 10 }}>
            UC18 · Dar de alta un local nuevo
          </div>
          <input
            placeholder="Nombre comercial"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, fontSize: 14, marginBottom: 8, fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
          />
          <input
            placeholder="Descripción"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, fontSize: 14, marginBottom: 10, fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
          />
          <button
            onClick={crear}
            style={{ width: "100%", background: C.admin, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
          >
            Crear local y su vista de proveedor
          </button>
          <div style={{ fontSize: 11, color: C.admin, marginTop: 8, lineHeight: 1.45 }}>
            Al crearlo se genera su vista de proveedor y queda pendiente configurar
            su integración con el ERP (UC7).
          </div>
        </Card>
      )}

      {locals.map((l) => (
        <LocalRow key={l.id} local={l} platos={menu.filter((m) => m.localId === l.id).length}
          ordenes={orders.filter((o) => o.items[0]?.localId === l.id).length}
          onToggle={() => toggleLocalActivo(l.id)} />
      ))}

      <PendingBadge label="Este rol se acordó verbalmente el 30-jul-2026 y no consta en el acta. Conviene incorporarlo formalmente." />
    </div>
  );
}

function LocalRow({ local, platos, ordenes, onToggle }: {
  local: Local; platos: number; ordenes: number; onToggle: () => void;
}) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: C.brandBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          {local.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{local.name}</div>
          <div style={{ fontSize: 12, color: C.textSec }}>{local.description}</div>
        </div>
        <span style={{
          background: local.activo ? C.successBg : C.sunken,
          color: local.activo ? C.successText : C.textMuted,
          borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "4px 10px",
        }}>
          {local.activo ? "Activo" : "Inactivo"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          { label: "Platos", value: platos },
          { label: "Órdenes", value: ordenes },
          { label: "Retiro hasta", value: local.horaMaximaRetiro },
        ].map((m) => (
          <div key={m.label} style={{ flex: 1, background: C.sunken, borderRadius: 10, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>{m.label.toUpperCase()}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{m.value}</div>
          </div>
        ))}
      </div>
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: "none", border: `1.5px solid ${local.activo ? C.errorText : C.successText}`,
          color: local.activo ? C.errorText : C.successText, borderRadius: 10, padding: "9px 0",
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
        }}
      >
        {local.activo ? "Desactivar local" : "Reactivar local"}
      </button>
    </Card>
  );
}

// ─── Soporte ──────────────────────────────────────────────────────────────────
function SoporteTab() {
  const { locals, erpEvents, orders } = useStore();
  const fallidos = erpEvents.filter((e) => e.status === "error");
  const pendientes = orders.filter((o) => o.status === "pendiente").length;
  const vencidas = orders.filter((o) => o.status === "vencido").length;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Soporte</h3>
        <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>UC19 · vista transversal de todos los locales</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {[
          { label: "Locales", value: locals.length, color: C.infoText, bg: C.infoBg },
          { label: "Órdenes activas", value: pendientes, color: C.brand, bg: C.brandBg },
          { label: "Sync fallidas", value: fallidos.length, color: C.errorText, bg: C.errorBg },
        ].map((k) => (
          <div key={k.label} style={{ flex: 1, background: k.bg, borderRadius: 12, padding: "12px 10px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: k.color, fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>
          Incidencias de sincronización
        </div>
        {fallidos.length === 0 ? (
          <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "14px 0" }}>
            Sin incidencias abiertas
          </div>
        ) : fallidos.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
            <Database size={16} color={C.errorText} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.type}</div>
              <div style={{ fontSize: 11, color: C.errorText }}>{e.payload}</div>
            </div>
            <button style={{
              background: C.errorBg, color: C.errorText, border: "none", borderRadius: 8,
              padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              Reintentar
            </button>
          </div>
        ))}
      </Card>

      {vencidas > 0 && (
        <Card style={{ background: C.warnBg, borderColor: C.warnText }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.warnText, marginBottom: 4 }}>
            {vencidas} orden{vencidas > 1 ? "es" : ""} vencida{vencidas > 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 12, color: C.warnText, lineHeight: 1.5 }}>
            El código venció al terminar el día de la compra sin que el estudiante
            retirara. <strong>Qué pasa con el dinero sigue sin definirse</strong> —
            es el punto que el acta dejó abierto.
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Plataforma ───────────────────────────────────────────────────────────────
function PlataformaTab() {
  const { locals, superAdminName } = useStore();

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Plataforma</h3>
        <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>UC20 · configuración general de Aliflow</div>
      </div>

      <Card>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 2 }}>SESIÓN</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{superAdminName || "soporte"}</div>
        <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Super-Admin de Aliflow</div>
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>
          Estado de las integraciones
        </div>
        {locals.map((l) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 16 }}>{l.emoji}</span>
            <div style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 600 }}>{l.name}</div>
            <span style={{
              background: l.id === "baru" ? C.successBg : C.warnBg,
              color: l.id === "baru" ? C.successText : C.warnText,
              borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "3px 9px",
            }}>
              {l.id === "baru" ? "Contífico" : l.id === "caramel" ? "Alpwin" : "Sin ERP"}
            </span>
          </div>
        ))}
      </Card>

      <Card style={{ background: C.infoBg, borderColor: C.infoText }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.infoText, marginBottom: 4 }}>
          Por qué existe este rol
        </div>
        <div style={{ fontSize: 12, color: C.infoText, lineHeight: 1.5 }}>
          Es el único rol sin local asignado, y por eso el único que puede ver
          más de una organización. Sin él, nadie dentro del sistema podría dar
          de alta un local nuevo — que era justamente el punto que quedó abierto
          el 28-jul.
        </div>
      </Card>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "locales", label: "Locales", icon: <Building2 size={20} /> },
    { id: "soporte", label: "Soporte", icon: <LifeBuoy size={20} /> },
    { id: "plataforma", label: "Plataforma", icon: <Settings size={20} /> },
  ];
  return (
    <div style={{
      display: "flex", justifyContent: "space-around", alignItems: "center",
      background: C.card, borderTop: `1px solid ${C.border}`, padding: "10px 0 22px",
    }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            border: "none", background: "none", cursor: "pointer",
            color: active === t.id ? C.admin : C.textMuted,
          }}
        >
          {t.icon}
          <span style={{ fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: active === t.id ? 700 : 400 }}>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function SuperAdminApp() {
  const { superAdminLoggedIn, superAdminLogout } = useStore();
  const [tab, setTab] = useState<Tab>("locales");

  if (!superAdminLoggedIn) return <SuperAdminLogin />;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.pageBg }}>
      <div style={{
        padding: "52px 20px 14px", background: C.admin,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>ALIFLOW ADMIN</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>Plataforma</div>
        </div>
        <button
          onClick={superAdminLogout}
          style={{
            background: "rgba(255,255,255,0.18)", color: "#fff", border: "none",
            borderRadius: 999, padding: "7px 13px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}
        >
          Salir
        </button>
      </div>

      {tab === "locales" && <LocalesTab />}
      {tab === "soporte" && <SoporteTab />}
      {tab === "plataforma" && <PlataformaTab />}

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
