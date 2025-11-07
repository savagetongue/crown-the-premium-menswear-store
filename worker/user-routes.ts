import { Hono } from "hono";
import type { Env } from './core-utils';
import { CategoryEntity, ProductEntity, InvoiceEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Invoice, Product } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Ensure seed data is present
  app.use('/api/*', async (c, next) => {
    await Promise.all([
      CategoryEntity.ensureSeed(c.env),
      ProductEntity.ensureSeed(c.env),
    ]);
    await next();
  });
  // CATEGORIES
  app.get('/api/categories', async (c) => {
    const { items } = await CategoryEntity.list(c.env);
    return ok(c, items);
  });
  // PRODUCTS
  app.get('/api/products', async (c) => {
    const { items } = await ProductEntity.list(c.env);
    return ok(c, items);
  });
  app.post('/api/products', async (c) => {
    const productData = await c.req.json();
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
    };
    const created = await ProductEntity.create(c.env, newProduct);
    return ok(c, created);
  });
  app.put('/api/products/:id', async (c) => {
    const { id } = c.req.param();
    const productData = await c.req.json();
    const product = new ProductEntity(c.env, id);
    if (!(await product.exists())) {
      return notFound(c, 'Product not found');
    }
    await product.patch(productData);
    return ok(c, await product.getState());
  });
  app.delete('/api/products/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await ProductEntity.delete(c.env, id);
    if (!deleted) {
      return notFound(c, 'Product not found');
    }
    return ok(c, { id });
  });
  // INVOICES
  app.get('/api/invoices', async (c) => {
    const { items } = await InvoiceEntity.list(c.env);
    // Sort by date descending
    items.sort((a, b) => b.date - a.date);
    return ok(c, items);
  });
  app.post('/api/invoices', async (c) => {
    const invoiceData = (await c.req.json()) as Omit<Invoice, 'id' | 'invoiceNumber' | 'date' | 'status' | 'amountInWords' | 'rounding'>;
    if (!invoiceData.customer || !invoiceData.items || invoiceData.items.length === 0) {
      return bad(c, 'Invalid invoice data');
    }
    // Server-side stock validation and deduction
    for (const item of invoiceData.items) {
      const product = new ProductEntity(c.env, item.productId);
      const productState = await product.getState();
      if (!productState || productState.quantity < item.quantity) {
        return bad(c, `Not enough stock for ${item.productName}. Available: ${productState?.quantity || 0}`);
      }
    }
    // All items have sufficient stock, now deduct
    for (const item of invoiceData.items) {
      const product = new ProductEntity(c.env, item.productId);
      await product.mutate(p => ({ ...p, quantity: p.quantity - item.quantity }));
    }
    const allInvoices = (await InvoiceEntity.list(c.env)).items;
    const nextInvoiceNumber = `INV-2024-${(allInvoices.length + 1).toString().padStart(4, '0')}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: crypto.randomUUID(),
      invoiceNumber: nextInvoiceNumber,
      date: Date.now(),
      status: 'paid',
      rounding: 0, // Placeholder
      amountInWords: '', // Placeholder
    };
    const created = await InvoiceEntity.create(c.env, newInvoice);
    return ok(c, created);
  });
}