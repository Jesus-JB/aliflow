import { useState, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { AppContext, StoreData, createInitialData, createActions } from "./store";
import { StudentApp } from "./components/StudentApp";
import { ProviderApp } from "./components/ProviderApp";
import { OperatorApp } from "./components/OperatorApp";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "estudiante" | "proveedor" | "operador";

const ROLE_LABELS: Record<Role, { label: string; emoji: string; color: string }> = {
  estudiante: { label: "Estudiante", emoji: "🎓", color: "#E05423" },
  proveedor:  { label: "Proveedor",  emoji: "🍳", color: "#2B5CE6" },
  operador:   { label: "Operador",   emoji: "🏷",  color: "#12805C" },
};

// ─── Role Switcher ────────────────────────────────────────────────────────────
function RoleSwitcher({ active, onChange }: { active: Role; onChange: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  const current = ROLE_LABELS[active];

  return (
    <>
      {/* Floating pill — top-right of phone wrapper */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "absolute",
          top: 72,
          right: -48,
          zIndex: 300,
          background: current.color,
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "8px 12px",
          cursor: "pointer",
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          writingMode: "vertical-lr",
          letterSpacing: 0.5,
        }}
      >
        <span style={{ fontSize: 18, writingMode: "horizontal-tb" }}>{current.emoji}</span>
        <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 11 }}>{current.label} ▴</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 298 }}
          />
          <div
            style={{
              position: "absolute",
              top: 72,
              right: -210,
              zIndex: 299,
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #E4E7EC",
              boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
              overflow: "hidden",
              width: 200,
            }}
          >
            <div style={{ padding: "10px 14px 8px", fontSize: 10, color: "#98A1AE", fontWeight: 700, letterSpacing: 0.8, borderBottom: "1px solid #E4E7EC" }}>
              CAMBIAR ROL
            </div>
            {(Object.entries(ROLE_LABELS) as [Role, typeof ROLE_LABELS[Role]][]).map(([r, info]) => (
              <button
                key={r}
                onClick={() => { onChange(r); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "12px 16px", background: active === r ? `${info.color}12` : "transparent",
                  border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
                  fontSize: 14, fontWeight: active === r ? 700 : 500,
                  color: active === r ? info.color : "#14161A",
                  borderLeft: active === r ? `3px solid ${info.color}` : "3px solid transparent",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 18 }}>{info.emoji}</span>
                {info.label}
                {active === r && <span style={{ marginLeft: "auto", fontSize: 13 }}>✓</span>}
              </button>
            ))}
            <div style={{ padding: "8px 14px 10px", fontSize: 10, color: "#98A1AE", lineHeight: 1.4, borderTop: "1px solid #E4E7EC" }}>
              Estado compartido en memoria. Los 3 roles operan sobre los mismos datos.
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── State Provider ────────────────────────────────────────────────────────────
function useAppState() {
  const [data, setData] = useState<StoreData>(createInitialData);
  // Use a ref so actions always read the latest state, not a stale closure
  const dataRef = useRef(data);
  dataRef.current = data;
  const actions = createActions(() => dataRef.current, setData);
  return { ...data, ...actions };
}

// ─── Mobile Frame ─────────────────────────────────────────────────────────────
export default function App() {
  const appState = useAppState();
  const [role, setRole] = useState<Role>("estudiante");
  const [justReset, setJustReset] = useState(false);

  function handleRoleChange(newRole: Role) {
    setRole(newRole);
  }

  // Restaura los datos iniciales y vuelve al Estudiante, que es donde
  // empieza el recorrido de la demostración.
  function handleReset() {
    appState.resetDemo();
    setRole("estudiante");
    setJustReset(true);
    setTimeout(() => setJustReset(false), 1800);
  }

  return (
    <AppContext.Provider value={appState}>
      {/* Page background */}
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #e8e8e8 0%, #d8d8d8 100%)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "24px 0 48px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Phone wrapper (position relative for role switcher overlay) */}
        <div style={{ position: "relative" }}>
          {/* Mobile phone frame */}
          <div
            style={{
              width: 390,
              height: "calc(100vh - 72px)",
              maxHeight: 844,
              minHeight: 640,
              background: "#F5F6F8",
              borderRadius: 40,
              overflow: "hidden",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 80px rgba(0,0,0,0.25), 0 0 0 8px #c8c8c8, 0 0 0 10px #b8b8b8",
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 120,
                height: 28,
                background: "#1a1a1a",
                borderRadius: "0 0 20px 20px",
                zIndex: 200,
              }}
            />

            {/* Status bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                zIndex: 50,
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: role === "estudiante" ? "#fff" : "#14161A" }}>9:41</span>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: role === "estudiante" ? "#fff" : "#14161A" }}>▂▄▆</span>
                <span style={{ fontSize: 11, color: role === "estudiante" ? "#fff" : "#14161A" }}>WiFi</span>
                <span style={{ fontSize: 11, color: role === "estudiante" ? "#fff" : "#14161A" }}>🔋</span>
              </div>
            </div>

            {/* App content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {role === "estudiante" && <StudentApp />}
              {role === "proveedor" && <ProviderApp />}
              {role === "operador" && <OperatorApp />}
            </div>
          </div>

          {/* Role switcher — outside the clipped phone frame */}
          <RoleSwitcher active={role} onChange={handleRoleChange} />
        </div>

        {/* Legend below phone */}
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            borderRadius: 999,
            padding: "8px 8px 8px 16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.06)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 12, color: "#5A6472" }}>
            {justReset
              ? "Demo reiniciada · saldo $12.40, sin órdenes"
              : "Aliflow Prototipo · Estado compartido en memoria entre los 3 roles"}
          </span>
          <button
            onClick={handleReset}
            title="Restaura saldo, stock, órdenes y cartillas a su estado inicial"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: justReset ? "#12805C" : "#14161A",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "7px 14px",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 12,
              transition: "background 0.2s ease",
            }}
          >
            <RotateCcw size={13} strokeWidth={2.5} />
            {justReset ? "Listo" : "Reiniciar demo"}
          </button>
        </div>
      </div>
    </AppContext.Provider>
  );
}
