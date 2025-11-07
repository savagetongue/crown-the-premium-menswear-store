import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Invoice, StoreSettings } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, AlertTriangle } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
function InvoiceView({ invoice, settings }: { invoice: Invoice; settings: StoreSettings }) {
  return (
    <Card className="w-full max-w-4xl mx-auto my-8 print:shadow-none print:border-none p-4 sm:p-6">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">{settings.name}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {settings.address}<br />
          Phone: {settings.phone}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-8 py-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold">Invoice</h2>
            <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Date Issued</p>
            <p className="text-muted-foreground">{format(new Date(invoice.date), 'PPP')}</p>
          </div>
        </div>
        <div className="mb-8">
          <h3 className="font-semibold">Bill To</h3>
          <p className="text-muted-foreground">{invoice.customer.name}</p>
        </div>
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{invoice.subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-green-600">-₹{invoice.totalDiscount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₹{invoice.tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span >Grand Total</span><span>₹{invoice.grandTotal.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="mt-6 text-sm text-muted-foreground">
          <p><span className="font-semibold">Amount in words:</span> {invoice.amountInWords}</p>
        </div>
      </CardContent>
    </Card>
  );
}
export function PublicInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { data: invoice, isLoading: isLoadingInvoice, error: invoiceError } = useQuery<Invoice>({
    queryKey: ['publicInvoice', invoiceId],
    queryFn: () => api(`/api/invoices/${invoiceId}/public`),
    enabled: !!invoiceId,
  });
  const { data: settings, isLoading: isLoadingSettings, error: settingsError } = useQuery<StoreSettings>({
    queryKey: ['settings'],
    queryFn: () => api('/api/settings'),
  });
  const isLoading = isLoadingInvoice || isLoadingSettings;
  const error = invoiceError || settingsError;
  return (
    <div className="min-h-screen bg-muted/40 p-2 sm:p-4 print:bg-white print:p-0">
      <Toaster />
      <div className="flex justify-center mb-4 print:hidden">
        <Button onClick={() => window.print()} disabled={isLoading || !!error}>
          <Printer className="mr-2 h-4 w-4" /> Print Invoice
        </Button>
      </div>
      {isLoading && (
        <Card className="w-full max-w-4xl mx-auto my-8">
          <CardHeader><Skeleton className="h-8 w-3/4 mx-auto" /><Skeleton className="h-4 w-1/2 mx-auto mt-2" /></CardHeader>
          <CardContent className="px-4 sm:px-8 py-6 space-y-6">
            <div className="flex justify-between"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-6 w-1/4" /></div>
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex justify-end"><div className="w-full max-w-xs space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div></div>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="w-full max-w-md mx-auto my-8 text-center">
          <CardHeader><CardTitle className="text-destructive flex items-center justify-center gap-2"><AlertTriangle /> Error</CardTitle></CardHeader>
          <CardContent><p>Could not load invoice. The link may be invalid or expired.</p><p className="text-xs text-muted-foreground mt-2">{error.message}</p></CardContent>
        </Card>
      )}
      {invoice && settings && <InvoiceView invoice={invoice} settings={settings} />}
    </div>
  );
}