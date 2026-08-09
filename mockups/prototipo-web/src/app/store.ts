// Aliflow – shared in-memory state
import { createContext, useContext } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "pendiente" | "listo" | "entregado" | "canjeado" | "vencido";

/**
 * Estados oficiales del código de retiro (acta 30-jul-2026 §6.3).
 * El código vale ÚNICAMENTE el día de la compra: si se presenta otro día,
 * el sistema debe mostrarlo como vencido.
 */
export type EstadoCodigo = "VALIDO" | "UTILIZADO" | "VENCIDO";

export interface OrderItem {
  dishId: string;
  dishName: string;
  localId: string;
  localName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  pickupCode: string;
  /** Estado del código de retiro: VALIDO / UTILIZADO / VENCIDO. */
  codigoEstado: EstadoCodigo;
  /** Hora máxima de retiro heredada del local al momento de comprar. */
  horaMaximaRetiro: string;
  studentId: string;
  items: OrderItem[];
  /** Suma de los ítems a precio de lista, antes de descuentos. */
  subtotal: number;
  /**
   * Descuento aplicado. Un canje de fidelidad NO es una venta de $0: es una
   * venta con descuento del 100% rotulado (decisión de Negocios, 8-ago-2026).
   * Así el local puede ver cuánto le costaron los premios —dato que con una
   * orden de $0 no existe— y el ERP recibe un documento que entiende.
   */
  descuento: number;
  motivoDescuento?: string;
  /** Lo que realmente se cobró: subtotal - descuento. */
  total: number;
  status: OrderStatus;
  createdAt: Date;
  deliveredAt?: Date;
  deliveredBy?: string;
  deliveryPoint?: string;
  isRedemption: boolean;
}

export interface MenuItem {
  id: string;
  localId: string;
  name: string;
  description: string;
  price: number;
  /**
   * Espejo informativo del stock del ERP del local. NO es lo que decide si
   * Aliflow puede vender — sirve para conciliar y para que el proveedor
   * decida cuánto cupo asignar.
   */
  stock: number;
  /**
   * Cupo reservado EXCLUSIVAMENTE para Aliflow (acta 30-jul-2026 §1.3).
   * De 100 almuerzos el local puede asignar 75 a caja y 25 a Aliflow.
   * La compra se valida contra `cupoAliflow - cupoConsumido`, no contra
   * `stock`: así Aliflow deja de competir con la caja por el mismo dato y
   * la sobreventa se elimina por diseño, no sincronizando más seguido.
   */
  cupoAliflow: number;
  cupoConsumido: number;
  published: boolean;
  imageEmoji: string;
}

/** Unidades que a Aliflow todavía le quedan por vender de este plato. */
export function cupoDisponible(m: MenuItem): number {
  return Math.max(0, m.cupoAliflow - m.cupoConsumido);
}

/**
 * Al estudiante NUNCA se le muestra la cantidad, solo si hay o no (RN-15,
 * pedido por Negocios el 9-ago-2026). El número del cupo es un acuerdo interno
 * entre el local y Aliflow: mostrar "quedan 3" cuando el local tiene 40
 * almuerzos en la cocina sería engañoso. El Proveedor sí ve la cifra exacta.
 */
export function hayDisponibilidad(m: MenuItem): boolean {
  return cupoDisponible(m) > 0;
}

/** Saldo del estudiante en ese establecimiento; 0 si nunca recargó ahí. */
export function saldoEn(data: StoreData, localId: string): number {
  return data.balances[localId] ?? 0;
}

export interface Local {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /**
   * Hora máxima de retiro, configurable por cada local (acta §6.1).
   * NO es constante del sistema: el mensaje que ve el estudiante tras
   * comprar se arma con este valor, y de aquí sale la expiración del
   * código de retiro.
   */
  horaMaximaRetiro: string;
  activo: boolean;
}

export interface LoyaltyCard {
  localId: string;
  stampsEarned: number;
  stampsRequired: number;
  reward: string;
  rewardPrice: number;
  maxStampsPerDay: number;
  expiryDays: number;
  lastStampDate?: string;
}

export interface ERPEvent {
  id: string;
  type: string;
  payload: string;
  status: "pendiente" | "sincronizado" | "error";
  timestamp: Date;
}

// ─── Mutable store data ───────────────────────────────────────────────────────

export interface StoreData {
  /**
   * Saldo POR ESTABLECIMIENTO (decisión #13, 8-ago-2026). El saldo pertenece
   * al local, no al estudiante: se recarga para un local y solo se gasta ahí.
   * El dinero va directo a la cuenta de ese proveedor — Aliflow no lo custodia.
   * Modelo de referencia aportado por el cliente: la app Parqueo Positivo.
   */
  balances: Record<string, number>;
  /**
   * Establecimiento activo. Hay que elegir uno antes de poder operar, y de él
   * dependen a la vez el menú, el saldo y la cartilla.
   */
  selectedLocalId: string | null;
  studentName: string;
  orders: Order[];
  loyaltyCards: Record<string, LoyaltyCard>;
  locals: Local[];
  menu: MenuItem[];
  erpEvents: ERPEvent[];
  /**
   * La sesión de cada rol vive en el store, no en el estado local de cada
   * componente: al cambiar de rol el componente se desmonta, y si la sesión
   * fuera local habría que volver a iniciarla en cada cambio.
   */
  studentLoggedIn: boolean;
  providerLoggedIn: boolean;
  providerUser: string;
  operatorLoggedIn: boolean;
  operatorName: string;
  operatorPoint: string;
  /** Cuarto rol, acordado el 30-jul-2026: administrador del lado de Aliflow. */
  superAdminLoggedIn: boolean;
  superAdminName: string;
  /**
   * Marca el sello recién acreditado para que la cartilla del Estudiante pueda
   * animarlo una sola vez. `at` cambia en cada acreditación, así que sirve como
   * key de React para reiniciar la animación aunque sea el mismo local.
   */
  lastStamp: { localId: string; index: number; at: number } | null;
}

// ─── AppState (data + actions) ────────────────────────────────────────────────

export interface AppState extends StoreData {
  purchaseDish: (item: MenuItem) => { success: boolean; order?: Order; error?: string };
  /** Recarga SIEMPRE contra un establecimiento concreto (decisión #13). */
  rechargeBalance: (localId: string, amount: number) => void;
  /** Cambia el establecimiento activo: con él cambian menú, saldo y cartilla. */
  selectLocal: (localId: string) => void;
  validateCode: (code: string) => { success: boolean; order?: Order; error?: string; alreadyUsed?: boolean; expired?: boolean };
  redeemLoyalty: (localId: string) => { success: boolean; order?: Order; error?: string };
  updateStock: (dishId: string, delta: number) => void;
  /** Asigna, aumenta o reduce el cupo exclusivo de Aliflow (UC16). */
  updateCupoAliflow: (dishId: string, delta: number) => void;
  /** Configura la hora máxima de retiro del local (UC17). */
  updateHoraMaximaRetiro: (localId: string, hora: string) => void;
  togglePublished: (dishId: string) => void;
  updateLoyaltyConfig: (localId: string, config: Partial<LoyaltyCard>) => void;
  /** Da de alta un local nuevo — solo el Super-Admin (UC18). */
  altaLocal: (nombre: string, descripcion: string, emoji: string) => void;
  toggleLocalActivo: (localId: string) => void;
  superAdminLogin: (user: string, pass: string) => boolean;
  superAdminLogout: () => void;
  studentLogin: () => void;
  studentLogout: () => void;
  providerLogin: (user: string, pass: string) => boolean;
  providerLogout: () => void;
  operatorLogin: (user: string, pass: string, point: string) => boolean;
  operatorLogout: () => void;
  /** Restaura los datos iniciales para poder repetir la demostración. */
  resetDemo: () => void;
  /** Apaga la marca del sello recién acreditado una vez que ya se animó. */
  clearLastStamp: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOrderId(): string {
  return `A-${Math.floor(Math.random() * 90000) + 10000}`;
}

function generatePickupCode(): string {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

// ─── Initial data factory ─────────────────────────────────────────────────────

export function createInitialData(): StoreData {
  return {
    // Saldo por establecimiento. Se siembra con saldo en los dos locales, y a
    // propósito con poco en Caramel: sirve para mostrar en vivo el riesgo R-21
    // (saldo fragmentado) — alcanza para un café de $1.50 pero no para el
    // sánduche de $2.75, aunque el estudiante tenga $14.40 en la plataforma.
    balances: { baru: 12.40, caramel: 2.00 },
    // Arranca sin elegir: la app obliga a seleccionar establecimiento antes de
    // mostrar menú o saldo, igual que Parqueo Positivo (RF-15).
    selectedLocalId: null,
    studentName: "Ana M.",
    // Orden sembrada de AYER, ya vencida: permite demostrar el tercer estado
    // del código (VENCIDO) sin tener que esperar a que pase un día.
    // Teclear 200315 en la pantalla del Operador muestra ese caso.
    orders: [
      {
        id: "A-20031",
        pickupCode: "200315",
        codigoEstado: "VENCIDO",
        horaMaximaRetiro: "14:00",
        studentId: "student-1",
        items: [{ dishId: "baru-2", dishName: "Encebollado", localId: "baru", localName: "Barú", price: 3.00, quantity: 1 }],
        subtotal: 3.00,
        descuento: 0,
        total: 3.00,
        status: "vencido",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
        isRedemption: false,
      },
    ],
    loyaltyCards: {
      baru: { localId: "baru", stampsEarned: 6, stampsRequired: 8, reward: "Un almuerzo del día gratis", rewardPrice: 3.25, maxStampsPerDay: 1, expiryDays: 90 },
      caramel: { localId: "caramel", stampsEarned: 5, stampsRequired: 5, reward: "Café pequeño + quesito", rewardPrice: 0, maxStampsPerDay: 1, expiryDays: 90 },
    },
    locals: [
      { id: "baru", name: "Barú", description: "Comida casera ecuatoriana", emoji: "🍲", horaMaximaRetiro: "14:00", activo: true },
      { id: "caramel", name: "Caramel Coffee", description: "Café y sánduches artesanales", emoji: "☕", horaMaximaRetiro: "16:30", activo: true },
    ],
    // `stock` = espejo del ERP (lo que tiene el local en total).
    // `cupoAliflow` = unidades apartadas SOLO para Aliflow (acta §1.3).
    // Ej. Seco de pollo: el ERP reporta 12, pero el local apartó 5 para Aliflow.
    menu: [
      { id: "baru-1", localId: "baru", name: "Seco de pollo", description: "Pollo guisado con arroz, menestra, ensalada fresca y ají", price: 3.50, stock: 12, cupoAliflow: 5, cupoConsumido: 0, published: true, imageEmoji: "🍗" },
      { id: "baru-2", localId: "baru", name: "Encebollado", description: "Caldo tradicional con atún, yuca y curtido de cebolla", price: 3.00, stock: 5, cupoAliflow: 3, cupoConsumido: 0, published: true, imageEmoji: "🍜" },
      { id: "baru-3", localId: "baru", name: "Almuerzo del día", description: "Sopa + segundo + jugo. Varía cada día según disponibilidad", price: 3.25, stock: 20, cupoAliflow: 2, cupoConsumido: 0, published: true, imageEmoji: "🥘" },
      { id: "baru-4", localId: "baru", name: "Bowl de quinua", description: "Quinua con vegetales salteados, aguacate y aderezo", price: 4.00, stock: 6, cupoAliflow: 0, cupoConsumido: 0, published: true, imageEmoji: "🥗" },
      { id: "caramel-1", localId: "caramel", name: "Sánduche de pernil", description: "Pan artesanal con pernil, queso crema y vegetales frescos", price: 2.75, stock: 8, cupoAliflow: 4, cupoConsumido: 0, published: true, imageEmoji: "🥪" },
      { id: "caramel-2", localId: "caramel", name: "Café mediano", description: "Espresso con leche de su elección, caliente o frío", price: 1.50, stock: 20, cupoAliflow: 10, cupoConsumido: 0, published: true, imageEmoji: "☕" },
    ],
    erpEvents: [
      { id: "evt-1", type: "notifySale", payload: "orden A-10432 · Seco de pollo", status: "sincronizado", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
      { id: "evt-2", type: "notifySale", payload: "orden A-10438 · Encebollado", status: "sincronizado", timestamp: new Date(Date.now() - 1000 * 60 * 20) },
      { id: "evt-3", type: "notifyPayment", payload: "orden A-10390 · $3.50", status: "error", timestamp: new Date(Date.now() - 1000 * 60 * 10) },
    ],
    studentLoggedIn: false,
    providerLoggedIn: false,
    providerUser: "",
    operatorLoggedIn: false,
    operatorName: "",
    operatorPoint: "",
    superAdminLoggedIn: false,
    superAdminName: "",
    lastStamp: null,
  };
}

// ─── Actions factory (operate on a mutable data ref) ─────────────────────────

export function createActions(getData: () => StoreData, setData: (d: StoreData) => void) {
  function get() { return getData(); }
  function set(data: StoreData) { setData(data); }

  return {
    purchaseDish(item: MenuItem): { success: boolean; order?: Order; error?: string } {
      const s = get();
      const menuItem = s.menu.find((m) => m.id === item.id);
      // La disponibilidad se valida contra el CUPO RESERVADO de Aliflow,
      // no contra el stock del ERP (acta 30-jul-2026 §1.3).
      if (!menuItem || cupoDisponible(menuItem) <= 0) {
        return { success: false, error: "Sin cupo disponible en Aliflow" };
      }
      // El saldo es por establecimiento: una compra solo puede consumir el
      // saldo de SU local. Tener plata en otro local no sirve de nada (RN-13).
      const saldoLocal = saldoEn(s, item.localId);
      if (saldoLocal < item.price) {
        return { success: false, error: "Saldo insuficiente en este establecimiento" };
      }

      const local = s.locals.find((l) => l.id === item.localId)!;
      const order: Order = {
        id: generateOrderId(),
        pickupCode: generatePickupCode(),
        codigoEstado: "VALIDO",
        horaMaximaRetiro: local.horaMaximaRetiro,
        studentId: "student-1",
        items: [{ dishId: item.id, dishName: item.name, localId: item.localId, localName: local.name, price: item.price, quantity: 1 }],
        subtotal: item.price,
        descuento: 0,
        total: item.price,
        status: "pendiente",
        createdAt: new Date(),
        isRedemption: false,
      };

      set({
        ...s,
        balances: { ...s.balances, [item.localId]: Math.round((saldoLocal - item.price) * 100) / 100 },
        orders: [order, ...s.orders],
        // Se consume el cupo de Aliflow y se refleja también en el espejo del ERP.
        menu: s.menu.map((m) => m.id === item.id
          ? { ...m, cupoConsumido: m.cupoConsumido + 1, stock: Math.max(0, m.stock - 1) }
          : m),
        erpEvents: [
          { id: `evt-${Date.now()}`, type: "notifySale", payload: `orden ${order.id} · ${item.name}`, status: "sincronizado", timestamp: new Date() },
          ...s.erpEvents,
        ],
      });

      return { success: true, order };
    },

    rechargeBalance(localId: string, amount: number) {
      const s = get();
      // El dinero va directo a la cuenta de ESE proveedor: Aliflow solo
      // registra el movimiento, nunca lo custodia (RN-14).
      set({
        ...s,
        balances: { ...s.balances, [localId]: Math.round((saldoEn(s, localId) + amount) * 100) / 100 },
      });
    },

    selectLocal(localId: string) {
      const s = get();
      set({ ...s, selectedLocalId: localId });
    },

    validateCode(code: string): { success: boolean; order?: Order; error?: string; alreadyUsed?: boolean; expired?: boolean } {
      const s = get();
      const order = s.orders.find((o) => o.pickupCode === code);
      if (!order) return { success: false, error: "Código inválido" };
      if (order.codigoEstado === "UTILIZADO") {
        return { success: false, alreadyUsed: true, order, error: "Código ya utilizado" };
      }
      // Tercer estado del acta §6.3: el código vale solo el día de la compra.
      if (order.codigoEstado === "VENCIDO") {
        return { success: false, expired: true, order, error: "Código vencido" };
      }

      const now = new Date();
      const updatedOrder: Order = {
        ...order,
        codigoEstado: "UTILIZADO",
        status: order.isRedemption ? "canjeado" : "entregado",
        deliveredAt: now,
        deliveredBy: s.operatorName,
        deliveryPoint: s.operatorPoint,
      };

      const localId = order.items[0]?.localId;
      let newLoyaltyCards = { ...s.loyaltyCards };
      let newLastStamp = s.lastStamp;

      if (localId && !order.isRedemption) {
        const card = s.loyaltyCards[localId];
        if (card) {
          const today = now.toISOString().split("T")[0];
          if (card.lastStampDate !== today && card.stampsEarned < card.stampsRequired) {
            newLoyaltyCards = {
              ...newLoyaltyCards,
              [localId]: { ...card, stampsEarned: card.stampsEarned + 1, lastStampDate: today },
            };
            // El sello nuevo ocupa la posición que antes estaba vacía.
            newLastStamp = { localId, index: card.stampsEarned, at: Date.now() };
          }
        }
      }

      set({
        ...s,
        orders: s.orders.map((o) => o.id === order.id ? updatedOrder : o),
        loyaltyCards: newLoyaltyCards,
        lastStamp: newLastStamp,
      });

      return { success: true, order: updatedOrder };
    },

    redeemLoyalty(localId: string): { success: boolean; order?: Order; error?: string } {
      const s = get();
      const card = s.loyaltyCards[localId];
      if (!card || card.stampsEarned < card.stampsRequired) {
        return { success: false, error: "No tienes sellos suficientes" };
      }

      // El premio también sale del cupo reservado de Aliflow, no del stock del ERP.
      const rewardDish = s.menu.find((m) => m.localId === localId && cupoDisponible(m) > 0);
      if (!rewardDish) return { success: false, error: "Sin cupo disponible para el premio" };

      const local = s.locals.find((l) => l.id === localId)!;
      const order: Order = {
        id: generateOrderId(),
        pickupCode: generatePickupCode(),
        codigoEstado: "VALIDO",
        horaMaximaRetiro: local.horaMaximaRetiro,
        studentId: "student-1",
        // El canje NO es una venta de $0: conserva el precio real del plato y
        // le aplica un descuento del 100% rotulado como premio (Negocios,
        // 8-ago-2026). Así el local ve cuánto le costó el premio y el ERP
        // recibe una venta con descuento, que es una operación que entiende.
        items: [{ dishId: rewardDish.id, dishName: card.reward, localId, localName: local.name, price: rewardDish.price, quantity: 1 }],
        subtotal: rewardDish.price,
        descuento: rewardDish.price,
        motivoDescuento: "Premio de fidelidad",
        total: 0,
        status: "pendiente",
        createdAt: new Date(),
        isRedemption: true,
      };

      set({
        ...s,
        orders: [order, ...s.orders],
        loyaltyCards: { ...s.loyaltyCards, [localId]: { ...card, stampsEarned: 0, lastStampDate: undefined } },
        menu: s.menu.map((m) => m.id === rewardDish.id
          ? { ...m, cupoConsumido: m.cupoConsumido + 1, stock: Math.max(0, m.stock - 1) }
          : m),
      });

      return { success: true, order };
    },

    updateStock(dishId: string, delta: number) {
      const s = get();
      set({ ...s, menu: s.menu.map((m) => m.id === dishId ? { ...m, stock: Math.max(0, m.stock + delta) } : m) });
    },

    togglePublished(dishId: string) {
      const s = get();
      set({ ...s, menu: s.menu.map((m) => m.id === dishId ? { ...m, published: !m.published } : m) });
    },

    updateLoyaltyConfig(localId: string, config: Partial<LoyaltyCard>) {
      const s = get();
      set({ ...s, loyaltyCards: { ...s.loyaltyCards, [localId]: { ...s.loyaltyCards[localId], ...config } } });
    },

    studentLogin() {
      const s = get();
      set({ ...s, studentLoggedIn: true });
    },

    studentLogout() {
      const s = get();
      set({ ...s, studentLoggedIn: false });
    },

    providerLogin(user: string, pass: string): boolean {
      if (user === "admin@baru.com.ec" && pass === "12345678") {
        const s = get();
        set({ ...s, providerLoggedIn: true, providerUser: user });
        return true;
      }
      return false;
    },

    providerLogout() {
      const s = get();
      set({ ...s, providerLoggedIn: false, providerUser: "" });
    },

    operatorLogin(user: string, _pass: string, point: string): boolean {
      if (user && point) {
        const s = get();
        set({ ...s, operatorLoggedIn: true, operatorName: user.split("@")[0], operatorPoint: point });
        return true;
      }
      return false;
    },

    operatorLogout() {
      const s = get();
      set({ ...s, operatorLoggedIn: false, operatorName: "", operatorPoint: "" });
    },

    // ── Acta 30-jul-2026 ──────────────────────────────────────────────────
    updateCupoAliflow(dishId: string, delta: number) {
      const s = get();
      set({
        ...s,
        menu: s.menu.map((m) => {
          if (m.id !== dishId) return m;
          // El cupo no puede bajar de lo ya consumido ni superar el stock del ERP.
          const nuevo = Math.min(m.stock, Math.max(m.cupoConsumido, m.cupoAliflow + delta));
          return { ...m, cupoAliflow: nuevo };
        }),
      });
    },

    updateHoraMaximaRetiro(localId: string, hora: string) {
      const s = get();
      set({
        ...s,
        locals: s.locals.map((l) => l.id === localId ? { ...l, horaMaximaRetiro: hora } : l),
      });
    },

    // ── Super-Admin (cuarto rol) ──────────────────────────────────────────
    altaLocal(nombre: string, descripcion: string, emoji: string) {
      const s = get();
      const id = nombre.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20) || `local-${s.locals.length + 1}`;
      if (s.locals.some((l) => l.id === id)) return;
      set({
        ...s,
        locals: [...s.locals, { id, name: nombre, description: descripcion, emoji, horaMaximaRetiro: "14:00", activo: true }],
        // Un local nuevo arranca sin saldo del estudiante: hay que recargar ahí.
        balances: { ...s.balances, [id]: 0 },
        loyaltyCards: s.loyaltyCards,
      });
    },

    toggleLocalActivo(localId: string) {
      const s = get();
      set({ ...s, locals: s.locals.map((l) => l.id === localId ? { ...l, activo: !l.activo } : l) });
    },

    superAdminLogin(user: string, pass: string): boolean {
      if (user && pass) {
        const s = get();
        set({ ...s, superAdminLoggedIn: true, superAdminName: user.split("@")[0] });
        return true;
      }
      return false;
    },

    superAdminLogout() {
      const s = get();
      set({ ...s, superAdminLoggedIn: false, superAdminName: "" });
    },

    resetDemo() {
      set(createInitialData());
    },

    clearLastStamp() {
      const s = get();
      if (s.lastStamp) set({ ...s, lastStamp: null });
    },
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const AppContext = createContext<AppState | null>(null);

export function useStore(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useStore must be used inside AppContext.Provider");
  return ctx;
}
