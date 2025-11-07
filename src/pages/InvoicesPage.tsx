import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Download, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Invoice } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceDetailSheet } from '@/components/invoice/InvoiceDetailSheet';
import { generateInvoicePdf } from '@/lib/pdf-generator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
export function InvoicesPage() {
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => api('/api/invoices'),
  });
  const sendInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => api<Invoice>(`/api/invoices/${invoiceId}/send`, { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(`Invoice #${data.invoiceNumber} sent successfully!`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error, variables) => {
      toast.error(`Failed to send invoice. Please try again.`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
  const handleDownloadPdf = async (invoice: Invoice) => {
    toast.info(`Generating PDF for invoice #${invoice.invoiceNumber}...`);
    try {
      await generateInvoicePdf(invoice);
      toast.success(`PDF for invoice #${invoice.invoiceNumber} downloaded.`);
    } catch (error) {
      toast.error('Failed to generate PDF.');
      console.error(error);
    }
  };
  const handleResendInvoice = (invoice: Invoice) => {
    toast.info(`Sending invoice #${invoice.invoiceNumber}...`);
    sendInvoiceMutation.mutate(invoice.id);
  };
  const renderMessagingStatus = (status?: 'pending' | 'sent' | 'failed') => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="mr-1 h-3 w-3" /> Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };
  return (
    <>
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
                    <TableHead>Message</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : invoices?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices?.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(invoice.date), 'PPP')}</TableCell>
                        <TableCell>{invoice.customer.name}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{renderMessagingStatus(invoice.messagingStatus)}</TableCell>
                        <TableCell className="text-right">₹{invoice.grandTotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)}>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResendInvoice(invoice)} disabled={sendInvoiceMutation.isPending && sendInvoiceMutation.variables === invoice.id}>
                                <Send className="mr-2 h-4 w-4" /> 
                                {sendInvoiceMutation.isPending && sendInvoiceMutation.variables === invoice.id ? 'Sending...' : 'Send Invoice'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      <InvoiceDetailSheet
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
        onDownloadPdf={handleDownloadPdf}
        onResendInvoice={handleResendInvoice}
      />
    </>
  );
}