import { Hono } from "hono";
import type { Env } from './core-utils';
import { CategoryEntity, ProductEntity, InvoiceEntity, StoreSettingsEntity, StaffEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Invoice, Product, StoreSettings, Category, SalesOverTime, TopSellingProduct, StaffMember } from "@shared/types";
import { format, subDays } from 'date-fns';
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
  // CATEGORIES
  app.get('/api/categories', async (c) => {
    const { items } = await CategoryEntity.list(c.env);
    return ok(c, items);
  });
  app.post('/api/categories', async (c) => {
    const { name } = await c.req.json<{ name: string }>();
    if (!name) return bad(c, 'Category name is required');
    const newCategory: Category = { id: crypto.randomUUID(), name };
    const created = await CategoryEntity.create(c.env, newCategory);
    return ok(c, created);
  });
  app.put('/api/categories/:id', async (c) => {
    const { id } = c.req.param();
    const { name } = await c.req.json<{ name: string }>();
    const category = new CategoryEntity(c.env, id);
    if (!(await category.exists())) return notFound(c, 'Category not found');
    await category.patch({ name });
    return ok(c, await category.getState());
  });
  app.delete('/api/categories/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await CategoryEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Category not found');
    return ok(c, { id });
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
    items.sort((a, b) => b.date - a.date);
    return ok(c, items);
  });
  app.get('/api/invoices/:id/public', async (c) => {
    const { id } = c.req.param();
    const invoice = new InvoiceEntity(c.env, id);
    if (!(await invoice.exists())) {
      return notFound(c, 'Invoice not found');
    }
    return ok(c, await invoice.getState());
  });
  app.post('/api/invoices', async (c) => {
    const invoiceData = (await c.req.json()) as Omit<Invoice, 'id' | 'invoiceNumber' | 'date' | 'status' | 'amountInWords' | 'rounding'>;
    if (!invoiceData.customer || !invoiceData.items || invoiceData.items.length === 0) {
      return bad(c, 'Invalid invoice data');
    }
    for (const item of invoiceData.items) {
      const product = new ProductEntity(c.env, item.productId);
      const productState = await product.getState();
      if (!productState || productState.quantity < item.quantity) {
        return bad(c, `Not enough stock for ${item.productName}. Available: ${productState?.quantity || 0}`);
      }
    }
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    const isSuccess = Math.random() > 0.2;
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
  // STAFF
  app.get('/api/staff', async (c) => {
    const { items } = await StaffEntity.list(c.env);
    return ok(c, items);
  });
  app.post('/api/staff', async (c) => {
    const staffData = await c.req.json<Omit<StaffMember, 'id'>>();
    if (!staffData.name || !staffData.pin || !staffData.role) {
      return bad(c, 'Missing required staff details');
    }
    const newStaff: StaffMember = { ...staffData, id: crypto.randomUUID() };
    const created = await StaffEntity.create(c.env, newStaff);
    return ok(c, created);
  });
  app.put('/api/staff/:id', async (c) => {
    const { id } = c.req.param();
    const staffData = await c.req.json<Partial<StaffMember>>();
    const staff = new StaffEntity(c.env, id);
    if (!(await staff.exists())) {
      return notFound(c, 'Staff member not found');
    }
    await staff.patch(staffData);
    return ok(c, await staff.getState());
  });
  app.delete('/api/staff/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await StaffEntity.delete(c.env, id);
    if (!deleted) {
      return notFound(c, 'Staff member not found');
    }
    return ok(c, { id });
  });
  // REPORTS
  app.get('/api/reports/summary', async (c) => {
    const { items: invoices } = await InvoiceEntity.list(c.env);
    const { items: products } = await ProductEntity.list(c.env);
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalSales = invoices.reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
    const uniqueCustomers = new Set(invoices.map(inv => inv.customer.phone).filter(Boolean)).size;
    return ok(c, {
      totalRevenue,
      totalSales,
      lowStockItems,
      newCustomers: uniqueCustomers,
    });
  });
  app.get('/api/reports/sales-over-time', async (c) => {
    const { items: invoices } = await InvoiceEntity.list(c.env);
    const salesByMonth: { [key: string]: number } = {};
    invoices.forEach(inv => {
      const month = format(new Date(inv.date), 'MMM');
      salesByMonth[month] = (salesByMonth[month] || 0) + inv.grandTotal;
    });
    const salesData: SalesOverTime[] = Object.entries(salesByMonth).map(([name, sales]) => ({ name, sales }));
    return ok(c, salesData);
  });
  app.get('/api/reports/top-selling', async (c) => {
    const { items: invoices } = await InvoiceEntity.list(c.env);
    const productSales = new Map<string, { name: string; unitsSold: number; totalRevenue: number }>();
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const existing = productSales.get(item.productId) || { name: item.productName, unitsSold: 0, totalRevenue: 0 };
        existing.unitsSold += item.quantity;
        const itemTotal = item.price * item.quantity;
        const discountAmount = item.discountType === 'percentage' ? itemTotal * (item.discount / 100) : item.discount;
        existing.totalRevenue += itemTotal - discountAmount;
        productSales.set(item.productId, existing);
      });
    });
    const sortedProducts: TopSellingProduct[] = Array.from(productSales.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.unitsSold - a.unitsSold);
    return ok(c, sortedProducts);
  });
  app.get('/api/reports/low-stock', async (c) => {
    const threshold = parseInt(c.req.query('threshold') || '10');
    const { items: products } = await ProductEntity.list(c.env);
    const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= threshold);
    return ok(c, lowStockProducts);
  });
  app.get('/api/reports/dead-stock', async (c) => {
    const days = parseInt(c.req.query('days') || '90');
    const sinceDate = subDays(new Date(), days);
    const { items: invoices } = await InvoiceEntity.list(c.env);
    const { items: products } = await ProductEntity.list(c.env);
    const soldProductIds = new Set<string>();
    invoices.forEach(invoice => {
      if (new Date(invoice.date) >= sinceDate) {
        invoice.items.forEach(item => soldProductIds.add(item.productId));
      }
    });
    const deadStockProducts = products.filter(p => !soldProductIds.has(p.id));
    return ok(c, deadStockProducts);
  });
}