import { Entity, IndexedEntity } from "./core-utils";
import type { Product, Category, Invoice, StoreSettings, StaffMember } from "@shared/types";
import type { Env } from './core-utils';
export class CategoryEntity extends IndexedEntity<Category> {
  static readonly entityName = "category";
  static readonly indexName = "categories";
  static readonly initialState: Category = { id: "", name: "" };
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
    name: 'CROWN - The Premium Menswear',
    address: 'Shreepur-Khandali Road, Shreepur 413112',
    phone: '+91 98765 43210',
    taxRate: 18,
  };
  static get(env: Env): StoreSettingsEntity {
    return new StoreSettingsEntity(env, 'singleton');
  }
}
export class StaffEntity extends IndexedEntity<StaffMember> {
  static readonly entityName = "staff";
  static readonly indexName = "staff_members";
  static readonly initialState: StaffMember = {
    id: "",
    name: "",
    role: "staff",
    pin: "",
  };
}