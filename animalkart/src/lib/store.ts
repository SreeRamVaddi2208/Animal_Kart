import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CartItem } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (warehouse_id: number) => void;
  updateQuantity: (warehouse_id: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setUser: (user, token, refreshToken) =>
        set({ user, token, refreshToken: refreshToken ?? null, isAuthenticated: true }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () =>
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'animalkart-auth' }
  )
);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(i => i.warehouse_id === item.warehouse_id);
        if (existing) {
          set({
            items: get().items.map(i =>
              i.warehouse_id === item.warehouse_id
                ? { ...i, quantity: item.quantity, total: item.quantity * item.unit_price }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (warehouse_id) =>
        set({ items: get().items.filter(i => i.warehouse_id !== warehouse_id) }),
      updateQuantity: (warehouse_id, quantity) =>
        set({
          items: get().items.map(i =>
            i.warehouse_id === warehouse_id
              ? { ...i, quantity, total: quantity * i.unit_price }
              : i
          ),
        }),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, item) => sum + item.total, 0),
    }),
    { name: 'animalkart-cart' }
  )
);
