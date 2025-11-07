import { create } from 'zustand';
import { Product } from '@shared/types';
import { toast } from 'sonner';
export interface CartItem extends Product {
  quantity: number;
  originalPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
}
type CartState = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyItemDiscount: (productId: string, discount: number, discountType: 'percentage' | 'fixed') => void;
  updatePrice: (productId: string, newPrice: number) => void;
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
      return { items: [...state.items, { ...product, quantity: 1, originalPrice: product.price, discount: 0, discountType: 'fixed' }] };
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
        item.id === productId ? { ...item, discount, discountType, price: item.originalPrice } : item // Reset price if manual discount is applied
      ),
    })),
  updatePrice: (productId, newPrice) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === productId) {
          const discountAmount = item.originalPrice - newPrice;
          return {
            ...item,
            price: newPrice,
            discount: discountAmount,
            discountType: 'fixed',
          };
        }
        return item;
      }),
    })),
  clearCart: () => set({ items: [] }),
}));