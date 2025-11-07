import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, MinusCircle, Trash2, Search } from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { Product, Invoice, InvoiceItem } from '@shared/types';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
export function BillingPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api('/api/products'),
  });
  const createInvoiceMutation = useMutation({
    mutationFn: (newInvoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'date' | 'status' | 'amountInWords' | 'rounding'>) => api<Invoice>('/api/invoices', { method: 'POST', body: JSON.stringify(newInvoice) }),
    onSuccess: (data) => {
      toast.success(`Invoice #${data.invoiceNumber} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      clearCart();
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });
  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const subTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const handleFinalizeBill = () => {
    if (items.length === 0) {
      toast.error("Cart is empty. Add items to create a bill.");
      return;
    }
    // Client-side stock check (preliminary)
    for (const item of items) {
      const productInStock = products?.find(p => p.id === item.id);
      if (!productInStock || productInStock.quantity < item.quantity) {
        toast.error(`Not enough stock for ${item.name}. Available: ${productInStock?.quantity || 0}`);
        return;
      }
    }
    const invoiceItems: InvoiceItem[] = items.map(item => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      discount: 0,
      discountType: 'fixed',
    }));
    const newInvoice = {
      customer: { name: 'Walk-in Customer', phone: '' },
      items: invoiceItems,
      subTotal: subTotal,
      totalDiscount: 0,
      tax: 0, // Assuming tax calculation happens on backend or is 0 for now
      grandTotal: subTotal,
    };
    createInvoiceMutation.mutate(newInvoice);
  };
  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-2xl font-bold">Billing / POS</h1>
      </header>
      <div className="flex-1 grid md:grid-cols-3 gap-6 p-6 overflow-hidden">
        {/* Product Selection */}
        <div className="md:col-span-2 flex flex-col h-full">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {isLoadingProducts ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="w-16 h-16 rounded-md mb-2" /><Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-3 w-1/2" /></CardContent></Card>
                ))
              ) : (
                filteredProducts?.map((product) => (
                  <Card
                    key={product.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${product.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => product.quantity > 0 ? addItem(product) : toast.warning(`${product.name} is out of stock.`)}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-muted rounded-md mb-2 flex items-center justify-center relative">
                        <span className="text-2xl font-bold text-muted-foreground">{product.name.charAt(0)}</span>
                        {product.quantity === 0 && <Badge variant="destructive" className="absolute -top-2 -right-2">Sold Out</Badge>}
                      </div>
                      <p className="text-sm font-medium leading-tight">{product.name}</p>
                      <p className="text-xs text-muted-foreground">₹{product.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        {/* Cart */}
        <div className="md:col-span-1 flex flex-col h-full bg-muted/20 rounded-lg">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Current Bill</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">Cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <span className="font-bold w-6 text-center">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </ScrollArea>
            {items.length > 0 && (
              <div className="p-6 border-t mt-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="font-medium">₹{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="font-medium text-green-600">-₹0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (GST)</span>
                    <span className="font-medium">₹0.00</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{subTotal.toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="lg" onClick={handleFinalizeBill} disabled={createInvoiceMutation.isPending}>
                  {createInvoiceMutation.isPending ? 'Processing...' : 'Finalize Bill'}
                </Button>
                <Button className="w-full mt-2" variant="outline" onClick={clearCart}>
                  Clear Cart
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}