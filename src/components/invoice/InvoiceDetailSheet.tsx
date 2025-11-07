import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Invoice } from '@shared/types';
import { format } from 'date-fns';
import { Download, Send } from 'lucide-react';
interface InvoiceDetailSheetProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  onResendInvoice: (invoice: Invoice) => void;
}
export function InvoiceDetailSheet({
  invoice,
  open,
  onOpenChange,
  onDownloadPdf,
  onResendInvoice,
}: InvoiceDetailSheetProps) {
  if (!invoice) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Invoice #{invoice.invoiceNumber}</SheetTitle>
          <SheetDescription>
            Date: {format(new Date(invoice.date), 'PPP p')}
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Customer Details</h3>
              <p className="text-sm text-muted-foreground">{invoice.customer.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.customer.phone || 'No phone number'}</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
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
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{invoice.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">-₹{invoice.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>₹{invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2">
                <span>Grand Total</span>
                <span>₹{invoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="px-6 py-4 border-t">
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onResendInvoice(invoice)}>
              <Send className="mr-2 h-4 w-4" /> Resend
            </Button>
            <Button className="flex-1" onClick={() => onDownloadPdf(invoice)}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}