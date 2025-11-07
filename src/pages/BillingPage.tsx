import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, MinusCircle, Trash2, Search, Edit, Tag } from 'lucide-react';
import { useCartStore, CartItem } from '@/hooks/useCartStore';
import { Product, Invoice, InvoiceItem, StoreSettings } from '@shared/types';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createWhatsAppLink } from '@/lib/utils';
export function BillingPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billDiscount, setBillDiscount] = useState(0);
  const [billDiscountType, setBillDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);
  const [isPriceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | null>(null);
  const [selectedItemForPrice, setSelectedItemForPrice] = useState<CartItem | null>(null);
  const { items, addItem, removeItem, updateQuantity, clearCart, applyItemDiscount, updatePrice } = useCartStore();
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api('/api/products')
  });
  const { data: settings } = useQuery<StoreSettings>({
    queryKey: ['settings'],
    queryFn: () => api('/api/settings'),
  });
  const sendInvoiceMutation = useMutation({
    mutationFn: (invoice: Invoice) => api<Invoice>(`/api/invoices/${invoice.id}/send`, { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(`Invoice #${data.invoiceNumber} status updated to sent!`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error, invoice) => {
      toast.error(`Failed to update invoice #${invoice.invoiceNumber} status. Please resend manually.`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
  const createInvoiceMutation = useMutation({
    mutationFn: (newInvoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'date' | 'status' | 'amountInWords' | 'rounding'>) => api<Invoice>('/api/invoices', { method: 'POST', body: JSON.stringify(newInvoice) }),
    onSuccess: (data) => {
      toast.success(`Invoice #${data.invoiceNumber} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      clearCart();
      setCustomerName('');
      setCustomerPhone('');
      setBillDiscount(0);
      if (data.customer.phone && settings) {
        toast.info(`Opening WhatsApp to send invoice to ${data.customer.phone}...`);
        const whatsappUrl = createWhatsAppLink(data, settings);
        window.open(whatsappUrl, '_blank');
        sendInvoiceMutation.mutate(data);
      }
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    }
  });
  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const { subTotal, totalDiscount, tax, grandTotal } = useMemo(() => {
    const subTotal = items.reduce((acc, item) => acc + item.originalPrice * item.quantity, 0);
    let itemDiscounts = items.reduce((acc, item) => {
      const itemTotal = item.originalPrice * item.quantity;
      const discountAmount = item.discountType === 'percentage' ? itemTotal * (item.discount / 100) : item.discount * item.quantity;
      return acc + discountAmount;
    }, 0);
    const billDiscountAmount = billDiscountType === 'percentage' ? (subTotal - itemDiscounts) * (billDiscount / 100) : billDiscount;
    const totalDiscount = itemDiscounts + billDiscountAmount;
    const taxableAmount = subTotal - totalDiscount;
    const taxAmount = taxableAmount * ((settings?.taxRate || 0) / 100);
    const finalTotal = taxableAmount + taxAmount;
    return { subTotal, totalDiscount, tax: taxAmount, grandTotal: finalTotal };
  }, [items, billDiscount, billDiscountType, settings]);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const handleFinalizeBill = () => {
    if (items.length === 0) {
      toast.error("Cart is empty. Add items to create a bill.");
      return;
    }
    const invoiceItems: InvoiceItem[] = items.map((item) => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: item.discount,
      discountType: item.discountType
    }));
    const newInvoice = {
      customer: { name: customerName.trim() || 'Walk-in Customer', phone: customerPhone },
      items: invoiceItems,
      subTotal,
      totalDiscount,
      tax,
      grandTotal
    };
    createInvoiceMutation.mutate(newInvoice);
  };
  const handleItemDiscountSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItemForDiscount) return;
    const formData = new FormData(e.currentTarget);
    const discount = parseFloat(formData.get('discount') as string || '0');
    const discountType = formData.get('discountType') as 'percentage' | 'fixed';
    applyItemDiscount(selectedItemForDiscount.id, discount, discountType);
    setSelectedItemForDiscount(null);
  };
  const handlePriceChangeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItemForPrice) return;
    const formData = new FormData(e.currentTarget);
    const newPrice = parseFloat(formData.get('price') as string);
    if (!isNaN(newPrice) && newPrice >= 0) {
      updatePrice(selectedItemForPrice.id, newPrice);
    }
    setSelectedItemForPrice(null);
  };
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {isLoadingProducts ?
                Array.from({ length: 10 }).map((_, i) =>
                  <Card key={i}><CardContent className="p-4"><Skeleton className="w-16 h-16 rounded-md mb-2" /><Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-3 w-1/2" /></CardContent></Card>
                ) :
                filteredProducts?.map((product) =>
                  <Card
                    key={product.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${product.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => product.quantity > 0 ? addItem(product) : toast.warning(`${product.name} is out of stock.`)}>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-muted rounded-md mb-2 flex items-center justify-center relative">
                        <span className="text-2xl font-bold text-muted-foreground">{product.name.charAt(0)}</span>
                        {product.quantity === 0 && <Badge variant="destructive" className="absolute -top-2 -right-2">Sold Out</Badge>}
                      </div>
                      <p className="text-sm font-medium leading-tight">{product.name}</p>
                      <p className="text-xs text-muted-foreground">₹{product.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                )
              }
            </div>
          </ScrollArea>
        </div>
        <div className="lg:col-span-1 flex flex-col h-full bg-muted/20 rounded-lg">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Current Bill</CardTitle>
            </CardHeader>
            <div className="px-6 pb-4 space-y-3">
              <Input placeholder="Customer Name (default: Walk-in)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <Input placeholder="Customer Phone (for WhatsApp)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
            <ScrollArea className="flex-1">
              <CardContent>
                {items.length === 0 ?
                  <p className="text-center text-muted-foreground py-10">Cart is empty</p> :
                  <div className="space-y-4">
                    {items.map((item) =>
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.price !== item.originalPrice && <span className="line-through mr-1">₹{item.originalPrice.toFixed(2)}</span>}
                            ₹{item.price.toFixed(2)}
                          </p>
                          {item.discount > 0 && (
                            <p className="text-xs text-green-600">
                              Discount: ₹{item.discountType === 'fixed' ? (item.discount * item.quantity).toFixed(2) : `${(item.originalPrice * item.quantity * item.discount / 100).toFixed(2)} (${item.discount}%)`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedItemForPrice(item)}><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedItemForDiscount(item)}><Tag className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                          <span className="font-bold w-6 text-center">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                }
              </CardContent>
            </ScrollArea>
            {items.length > 0 &&
              <div className="p-6 border-t mt-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal ({totalItems} items)</span><span className="font-medium">₹{subTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between">
                    <Button variant="link" className="p-0 h-auto text-green-600" onClick={() => setDiscountModalOpen(true)}>Bill Discount</Button>
                    <span className="font-medium text-green-600">-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between"><span>Tax ({settings?.taxRate || 0}%)</span><span className="font-medium">₹{tax.toFixed(2)}</span></div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{Math.round(grandTotal).toFixed(2)}</span></div>
                </div>
                <Button className="w-full mt-4" size="lg" onClick={handleFinalizeBill} disabled={createInvoiceMutation.isPending}>
                  {createInvoiceMutation.isPending ? 'Processing...' : 'Finalize Bill'}
                </Button>
                <Button className="w-full mt-2" variant="outline" onClick={clearCart}>Clear Cart</Button>
              </div>
            }
          </Card>
        </div>
      </div>
      <Dialog open={isDiscountModalOpen} onOpenChange={setDiscountModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply Bill Discount</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input type="number" placeholder="Discount value" value={billDiscount} onChange={e => setBillDiscount(parseFloat(e.target.value) || 0)} />
            <RadioGroup defaultValue={billDiscountType} onValueChange={(v: 'percentage' | 'fixed') => setBillDiscountType(v)} className="flex gap-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="fixed" id="fixed" /><Label htmlFor="fixed">Fixed (₹)</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="percentage" /><Label htmlFor="percentage">Percentage (%)</Label></div>
            </RadioGroup>
          </div>
          <DialogFooter><Button onClick={() => setDiscountModalOpen(false)}>Apply</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedItemForDiscount} onOpenChange={(open) => !open && setSelectedItemForDiscount(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply Discount for {selectedItemForDiscount?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleItemDiscountSubmit} className="space-y-4 py-4">
            <Input name="discount" type="number" placeholder="Discount value" defaultValue={selectedItemForDiscount?.discount || 0} />
            <RadioGroup name="discountType" defaultValue={selectedItemForDiscount?.discountType || 'fixed'} className="flex gap-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="fixed" id="item-fixed" /><Label htmlFor="item-fixed">Fixed (₹)</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="item-percentage" /><Label htmlFor="item-percentage">Percentage (%)</Label></div>
            </RadioGroup>
            <DialogFooter><Button type="submit">Apply Discount</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedItemForPrice} onOpenChange={(open) => !open && setSelectedItemForPrice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Price for {selectedItemForPrice?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handlePriceChangeSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Original Price</Label>
              <Input value={`₹${selectedItemForPrice?.originalPrice.toFixed(2)}`} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-price">New Price</Label>
              <Input id="new-price" name="price" type="number" placeholder="Enter new price" defaultValue={selectedItemForPrice?.price || 0} />
            </div>
            <DialogFooter><Button type="submit">Update Price</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>);
}