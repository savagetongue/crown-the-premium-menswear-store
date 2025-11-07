import type { Product, Category } from './types';
export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Shirts' },
  { id: 'cat2', name: 'Trousers' },
  { id: 'cat3', name: 'Jackets' },
  { id: 'cat4', name: 'Accessories' },
];
export const MOCK_PRODUCTS: Product[] = [
  { id: 'prod1', name: 'Classic Oxford Shirt', sku: 'CROWN-SH-001', price: 2499, size: 'M', color: 'White', quantity: 50, categoryId: 'cat1' },
  { id: 'prod2', name: 'Linen Casual Shirt', sku: 'CROWN-SH-002', price: 2999, size: 'L', color: 'Blue', quantity: 30, categoryId: 'cat1' },
  { id: 'prod3', name: 'Slim Fit Chinos', sku: 'CROWN-TR-001', price: 3499, size: '32', color: 'Khaki', quantity: 40, categoryId: 'cat2' },
  { id: 'prod4', name: 'Wool Blend Trousers', sku: 'CROWN-TR-002', price: 4999, size: '34', color: 'Grey', quantity: 25, categoryId: 'cat2' },
  { id: 'prod5', name: 'Denim Jacket', sku: 'CROWN-JK-001', price: 5999, size: 'M', color: 'Indigo', quantity: 15, categoryId: 'cat3' },
  { id: 'prod6', name: 'Leather Belt', sku: 'CROWN-AC-001', price: 1999, quantity: 60, categoryId: 'cat4' },
  { id: 'prod7', name: 'Silk Tie', sku: 'CROWN-AC-002', price: 1499, color: 'Navy', quantity: 75, categoryId: 'cat4' },
  { id: 'prod8', name: 'Checkered Flannel Shirt', sku: 'CROWN-SH-003', price: 3199, size: 'XL', color: 'Red/Black', quantity: 22, categoryId: 'cat1' },
  { id: 'prod9', name: 'Cargo Trousers', sku: 'CROWN-TR-003', price: 3899, size: '32', color: 'Olive', quantity: 18, categoryId: 'cat2' },
  { id: 'prod10', name: 'Bomber Jacket', sku: 'CROWN-JK-002', price: 6499, size: 'L', color: 'Black', quantity: 12, categoryId: 'cat3' },
];