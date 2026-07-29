// Aliflow – shared in-memory state
import { createContext, useContext } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "pendiente" | "listo" | "entregado" | "canjeado";

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
  studentId: string;
  items: OrderItem[];
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
  stock: number;
  published: boolean;
  imageEmoji: string;
}

export interface Local {
  id: string;
  name: string;
  description: string;
  emoji: string;
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
  studentBalance: number;
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
  rechargeBalance: (amount: number) => void;
  validateCode: (code: string) => { success: boolean; order?: Order; error?: string; alreadyUsed?: boolean };
  redeemLoyalty: (localId: string) => { success: boolean; order?: Order; error?: string };
  updateStock: (dishId: string, delta: number) => void;
  togglePublished: (dishId: string) => void;
  updateLoyaltyConfig: (localId: string, config: Partial<LoyaltyCard>) => void;
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
    studentBalance: 12.40,
    studentName: "Ana M.",
    orders: [],
    loyaltyCards: {
      baru: { localId: "baru", stampsEarned: 6, stampsRequired: 8, reward: "Un almuerzo del día gratis", rewardPrice: 3.25, maxStampsPerDay: 1, expiryDays: 90 },
      caramel: { localId: "caramel", stampsEarned: 5, stampsRequired: 5, reward: "Café pequeño + quesito", rewardPrice: 0, maxStampsPerDay: 1, expiryDays: 90 },
    },
    locals: [
      { id: "baru", name: "Barú", description: "Comida casera ecuatoriana", emoji: "🍲" },
      { id: "caramel", name: "Caramel Coffee", description: "Café y sánduches artesanales", emoji: "☕" },
    ],
    menu: [
      { id: "baru-1", localId: "baru", name: "Seco de pollo", description: "Pollo guisado con arroz, menestra, ensalada fresca y ají", price: 3.50, stock: 12, published: true, imageEmoji: "🍗" },
      { id: "baru-2", localId: "baru", name: "Encebollado", description: "Caldo tradicional con atún, yuca y curtido de cebolla", price: 3.00, stock: 5, published: true, imageEmoji: "🍜" },
      { id: "baru-3", localId: "baru", name: "Almuerzo del día", description: "Sopa + segundo + jugo. Varía cada día según disponibilidad", price: 3.25, stock: 2, published: true, imageEmoji: "🥘" },
      { id: "baru-4", localId: "baru", name: "Bowl de quinua", description: "Quinua con vegetales salteados, aguacate y aderezo", price: 4.00, stock: 0, published: true, imageEmoji: "🥗" },
      { id: "caramel-1", localId: "caramel", name: "Sánduche de pernil", description: "Pan artesanal con pernil, queso crema y vegetales frescos", price: 2.75, stock: 8, published: true, imageEmoji: "🥪" },
      { id: "caramel-2", localId: "caramel", name: "Café mediano", description: "Espresso con leche de su elección, caliente o frío", price: 1.50, stock: 20, published: true, imageEmoji: "☕" },
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
      if (!menuItem || menuItem.stock <= 0) return { success: false, error: "Sin stock disponible" };
      if (s.studentBalance < item.price) return { success: false, error: "Saldo insuficiente" };

      const local = s.locals.find((l) => l.id === item.localId)!;
      const order: Order = {
        id: generateOrderId(),
        pickupCode: generatePickupCode(),
        studentId: "student-1",
        items: [{ dishId: item.id, dishName: item.name, localId: item.localId, localName: local.name, price: item.price, quantity: 1 }],
        total: item.price,
        status: "pendiente",
        createdAt: new Date(),
        isRedemption: false,
      };

      set({
        ...s,
        studentBalance: Math.round((s.studentBalance - item.price) * 100) / 100,
        orders: [order, ...s.orders],
        menu: s.menu.map((m) => m.id === item.id ? { ...m, stock: m.stock - 1 } : m),
        erpEvents: [
          { id: `evt-${Date.now()}`, type: "notifySale", payload: `orden ${order.id} · ${item.name}`, status: "sincronizado", timestamp: new Date() },
          ...s.erpEvents,
        ],
      });

      return { success: true, order };
    },

    rechargeBalance(amount: number) {
      const s = get();
      set({ ...s, studentBalance: Math.round((s.studentBalance + amount) * 100) / 100 });
    },

    validateCode(code: string): { success: boolean; order?: Order; error?: string; alreadyUsed?: boolean } {
      const s = get();
      const order = s.orders.find((o) => o.pickupCode === code);
      if (!order) return { success: false, error: "Código inválido" };
      if (order.status === "entregado" || order.status === "canjeado") {
        return { success: false, alreadyUsed: true, order, error: "Código ya utilizado" };
      }

      const now = new Date();
      const updatedOrder: Order = {
        ...order,
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

      const rewardDish = s.menu.find((m) => m.localId === localId && m.stock > 0);
      if (!rewardDish) return { success: false, error: "Sin stock disponible para el premio" };

      const local = s.locals.find((l) => l.id === localId)!;
      const order: Order = {
        id: generateOrderId(),
        pickupCode: generatePickupCode(),
        studentId: "student-1",
        items: [{ dishId: rewardDish.id, dishName: card.reward, localId, localName: local.name, price: 0, quantity: 1 }],
        total: 0,
        status: "pendiente",
        createdAt: new Date(),
        isRedemption: true,
      };

      set({
        ...s,
        orders: [order, ...s.orders],
        loyaltyCards: { ...s.loyaltyCards, [localId]: { ...card, stampsEarned: 0, lastStampDate: undefined } },
        menu: s.menu.map((m) => m.id === rewardDish.id ? { ...m, stock: m.stock - 1 } : m),
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
