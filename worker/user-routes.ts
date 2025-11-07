import { Hono } from "hono";
import type { Env } from './core-utils';
import { CategoryEntity, ProductEntity, InvoiceEntity } from "./entities";
import { ok, bad, isStr } from './core-utils';
import type { Invoice } from "@shared/types";
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
    const page = await CategoryEntity.list(c.env);
    return ok(c, page.items);
  });
  // PRODUCTS
  app.get('/api/products', async (c) => {
    const page = await ProductEntity.list(c.env);
    return ok(c, page.items);
  });
  // INVOICES
  app.get('/api/invoices', async (c) => {
    const page = await InvoiceEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/invoices', async (c) => {
    const invoiceData = (await c.req.json()) as Omit<Invoice, 'id'>;
    if (!invoiceData.customer || !invoiceData.items || invoiceData.items.length === 0) {
      return bad(c, 'Invalid invoice data');
    }
    const newInvoice: Invoice = {
      ...invoiceData,
      id: crypto.randomUUID(),
    };
    const created = await InvoiceEntity.create(c.env, newInvoice);
    return ok(c, created);
  });
}