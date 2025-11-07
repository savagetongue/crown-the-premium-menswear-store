import { Entity, IndexedEntity } from "./core-utils";
import type { Product, Category, Invoice, StoreSettings } from "@shared/types";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@shared/mock-data";
import type { Env } from './core-utils';
export class CategoryEntity extends IndexedEntity<Category> {
  static readonly entityName = "category";
  static readonly indexName = "categories";
  static readonly initialState: Category = { id: "", name: "" };
  static seedData = MOCK_CATEGORIES;
}
export class ProductEntity extends IndexedEntity<Product> {
  static readonly entityName = "product";
  static readonly indexName = "products";
  static readonly initialState: Product = {
    id: "",
    name: "",
    sku: "",
    price: 0,
    quantity: 0,
    categoryId: "",
  };
  static seedData = MOCK_PRODUCTS;
}
export class InvoiceEntity extends IndexedEntity<Invoice> {
  static readonly entityName = "invoice";
  static readonly indexName = "invoices";
  static readonly initialState: Invoice = {
    id: "",
    invoiceNumber: "",
    date: 0,
    customer: { name: "", phone: "" },
    items: [],
    subTotal: 0,
    totalDiscount: 0,
    tax: 0,
    rounding: 0,
    grandTotal: 0,
    amountInWords: "",
    status: "pending",
    messagingStatus: "pending",
  };
}
export class StoreSettingsEntity extends Entity<StoreSettings> {
  static readonly entityName = "storesettings";
  static readonly initialState: StoreSettings = {
    id: 'singleton',
    name: 'CROWN – The Premium Menswear',
    address: '123 Fashion Street, Metro City, 12345',
    phone: '+91 98765 43210',
    taxRate: 18,
  };
  static get(env: Env): StoreSettingsEntity {
    return new StoreSettingsEntity(env, 'singleton');
  }
}