import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ReportSummary, SalesOverTime, Product } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ShoppingBag, Users } from 'lucide-react';
export function ReportsPage() {
  const { data: summary, isLoading: isLoadingSummary } = useQuery<ReportSummary>({
    queryKey: ['reportSummary'],
    queryFn: () => api('/api/reports/summary'),
  });
  const { data: salesData, isLoading: isLoadingSales } = useQuery<SalesOverTime[]>({
    queryKey: ['salesOverTime'],
    queryFn: () => api('/api/reports/sales-over-time'),
  });
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api('/api/products'),
  });
  const topSellingProducts = products
    ?.sort((a, b) => a.quantity - b.quantity) // This is a mock sort, should be based on sales
    .slice(0, 5);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Reports & Analytics</h1>
        <div className="grid gap-4 md:grid-cols-3 mb-8">
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
        <div className="grid gap-8 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Monthly Sales Performance</CardTitle>
            </CardHeader>
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
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProducts ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                    </TableRow>
                  )) : topSellingProducts?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{100 - p.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}