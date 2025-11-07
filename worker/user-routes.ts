import { Hono } from "hono";
import type { Env } from './core-utils';
import { CategoryEntity, ProductEntity, InvoiceEntity, StoreSettingsEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Invoice, Product, StoreSettings } from "@shared/types";
// This is a simplified version of the amountToWords function for the backend.
// In a real-world scenario, this would be a shared utility.
function amountToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Lakh', 'Crore'];
  function toWords(n: number): string {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + toWords(n % 100) : '');
    return '';
  }
  if (amount === 0) return 'Zero';
  let words = '';
  let num = Math.floor(amount);
  let i = 0;
  while (num > 0) {
    let chunk;
    if (i === 0) {
      chunk = num % 1000;
      num = Math.floor(num / 1000);
    } else {
      chunk = num % 100;
      num = Math.floor(num / 100);
    }
    if (chunk > 0) {
      words = toWords(chunk) + ' ' + thousands[i] + ' ' + words;
    }
    i++;
  }
  const rupees = words.trim();
  const paise = Math.round((amount - Math.floor(amount)) * 100);
  if (paise > 0) {
    return `${rupees} Rupees and ${toWords(paise)} Paise Only`;
  } else {
    return `${rupees} Rupees Only`;
  }
}
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
    const grandTotal = invoiceData.grandTotal;
    const roundedTotal = Math.round(grandTotal);
    const rounding = roundedTotal - grandTotal;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: crypto.randomUUID(),
      invoiceNumber: nextInvoiceNumber,
      date: Date.now(),
      status: 'paid',
      grandTotal: roundedTotal,
      rounding: rounding,
      amountInWords: amountToWords(roundedTotal),
      messagingStatus: 'pending',
    };
    const created = await InvoiceEntity.create(c.env, newInvoice);
    return ok(c, created);
  });
  app.post('/api/invoices/:id/send', async (c) => {
    const { id } = c.req.param();
    const invoiceEntity = new InvoiceEntity(c.env, id);
    if (!(await invoiceEntity.exists())) {
      return notFound(c, 'Invoice not found');
    }
    // Mock sending logic
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    const isSuccess = Math.random() > 0.2; // 80% success rate
    const updatedInvoice = await invoiceEntity.mutate(invoice => ({
      ...invoice,
      messagingStatus: isSuccess ? 'sent' : 'failed',
    }));
    return ok(c, updatedInvoice);
  });
  // SETTINGS
  app.get('/api/settings', async (c) => {
    const settings = await StoreSettingsEntity.get(c.env).getState();
    return ok(c, settings);
  });
  app.post('/api/settings', async (c) => {
    const settingsData = await c.req.json<Partial<StoreSettings>>();
    const settingsEntity = StoreSettingsEntity.get(c.env);
    await settingsEntity.patch(settingsData);
    const updatedSettings = await settingsEntity.getState();
    return ok(c, updatedSettings);
  });
}