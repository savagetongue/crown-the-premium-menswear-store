import { create } from 'zustand';
import { Product } from '@shared/types';
import { toast } from 'sonner';
export interface CartItem extends Product {
  quantity: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
}
type CartState = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyItemDiscount: (productId: string, discount: number, discountType: 'percentage' | 'fixed') => void;
  clearCart: () => void;
};
export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id);
      if (existingItem) {
        toast.info(`${product.name} quantity updated in cart.`);
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      toast.success(`${product.name} added to cart.`);
      return { items: [...state.items, { ...product, quantity: 1, discount: 0, discountType: 'fixed' }] };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((item) => item.id !== productId),
        };
      }
      return {
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      };
    }),
  applyItemDiscount: (productId, discount, discountType) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId ? { ...item, discount, discountType } : item
      ),
    })),
  clearCart: () => set({ items: [] }),
}));