export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface Category {
  id: string;
  name: string;
}
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
  stockLocation?: string;
  categoryId: string;
}
export interface Customer {
  name: string;
  phone: string;
}
export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number; // in percentage or absolute value
  discountType: 'percentage' | 'fixed';
}
export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: number; // epoch timestamp
  customer: Customer;
  items: InvoiceItem[];
  subTotal: number;
  totalDiscount: number;
  tax: number;
  rounding: number;
  grandTotal: number;
  amountInWords: string;
  status: 'paid' | 'pending' | 'cancelled';
  messagingStatus?: 'pending' | 'sent' | 'failed';
}
export interface StoreSettings {
  id: 'singleton';
  name: string;
  address: string;
  logoUrl?: string;
  phone?: string;
  taxRate: number; // percentage
}
// Reporting Types
export interface ReportSummary {
  totalRevenue: number;
  totalSales: number;
  lowStockItems: number;
  newCustomers: number;
}
export interface SalesOverTime {
  name: string; // e.g., 'Jan', 'Feb'
  sales: number;
}