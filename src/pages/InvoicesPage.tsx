import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
const mockInvoices = [
  { id: 'inv1', invoiceNumber: 'INV-2024-001', date: new Date(), customer: { name: 'John Doe', phone: '1234567890' }, grandTotal: 3499, status: 'paid' },
  { id: 'inv2', invoiceNumber: 'INV-2024-002', date: new Date(Date.now() - 86400000), customer: { name: 'Jane Smith', phone: '0987654321' }, grandTotal: 5999, status: 'paid' },
  { id: 'inv3', invoiceNumber: 'INV-2024-003', date: new Date(Date.now() - 172800000), customer: { name: 'Peter Jones', phone: '1122334455' }, grandTotal: 1999, status: 'paid' },
];
export function InvoicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Invoices</h1>
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{format(invoice.date, 'PPP')}</TableCell>
                    <TableCell>{invoice.customer.name}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">₹{invoice.grandTotal.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}