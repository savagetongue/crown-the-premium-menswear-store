import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ReportSummary, SalesOverTime, Product, TopSellingProduct } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ShoppingBag, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
function GeneralReportTab() {
  const { data: summary, isLoading: isLoadingSummary } = useQuery<ReportSummary>({
    queryKey: ['reportSummary'],
    queryFn: () => api('/api/reports/summary'),
  });
  const { data: salesData, isLoading: isLoadingSales } = useQuery<SalesOverTime[]>({
    queryKey: ['salesOverTime'],
    queryFn: () => api('/api/reports/sales-over-time'),
  });
  const { data: topSelling, isLoading: isLoadingTopSelling } = useQuery<TopSellingProduct[]>({
    queryKey: ['topSelling'],
    queryFn: () => api('/api/reports/top-selling'),
  });
  return (
    <div className="space-y-8">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">₹{summary?.totalRevenue.toFixed(2)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{summary?.totalSales}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{summary?.newCustomers}</div>}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Monthly Sales Performance</CardTitle></CardHeader>
          <CardContent>
            {isLoadingSales ? <Skeleton className="h-[300px] w-full" /> :
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            }
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Units Sold</TableHead></TableRow></TableHeader>
                <TableBody>
                  {isLoadingTopSelling ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                    </TableRow>
                  )) : topSelling?.slice(0, 5).map(p => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.unitsSold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function InventoryReportTab({ type }: { type: 'low-stock' | 'dead-stock' }) {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: [type],
    queryFn: () => api(`/api/reports/${type}`),
  });
  const title = type === 'low-stock' ? 'Low Stock Items' : 'Dead Stock Items';
  const description = type === 'low-stock' ? 'Products with quantity 10 or less.' : 'Products not sold in the last 90 days.';
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Quantity</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              )) : products?.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="h-24 text-center">No products found.</TableCell></TableRow>
              ) : products?.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={p.quantity > 0 ? 'secondary' : 'destructive'}>{p.quantity}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
export function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="py-8 md:py-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Reports & Analytics</h1>
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="dead-stock">Dead Stock</TabsTrigger>
          </TabsList>
          <TabsContent value="general"><GeneralReportTab /></TabsContent>
          <TabsContent value="low-stock"><InventoryReportTab type="low-stock" /></TabsContent>
          <TabsContent value="dead-stock"><InventoryReportTab type="dead-stock" /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}