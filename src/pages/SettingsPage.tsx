import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { StoreSettings, StaffMember } from '@shared/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
const settingsSchema = z.object({
  name: z.string().min(3, 'Store name must be at least 3 characters'),
  address: z.string().min(10, 'Address seems too short'),
  phone: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100),
});
type SettingsFormData = z.infer<typeof settingsSchema>;
function StoreDetailsTab() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery<StoreSettings>({
    queryKey: ['settings'],
    queryFn: () => api('/api/settings'),
  });
  const updateSettingsMutation = useMutation({
    mutationFn: (updatedSettings: SettingsFormData) => api<StoreSettings>('/api/settings', { method: 'POST', body: JSON.stringify(updatedSettings) }),
    onSuccess: (data) => {
      toast.success('Settings updated successfully!');
      queryClient.setQueryData(['settings'], data);
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: '', address: '', phone: '', taxRate: 0 },
  });
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);
  const onSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Details</CardTitle>
        <CardDescription>Manage your store's information. This will be used on invoices.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Store Name</FormLabel><FormControl><Input placeholder="e.g., CROWN Menswear" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g., 123 Fashion Street, Metro City" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g., +91 98765 43210" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="taxRate" render={({ field }) => (<FormItem><FormLabel>Tax Rate (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 18" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={updateSettingsMutation.isPending || isLoading}>
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
function StaffManagementTab() {
  const [isFormOpen, setFormOpen] = useState(false);
  // Mock data for now
  const staff: StaffMember[] = [
    { id: '1', name: 'Admin User', role: 'admin', pin: '****' },
    { id: '2', name: 'Cashier 1', role: 'staff', pin: '****' },
  ];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff Management</CardTitle>
          <CardDescription>Add, edit, or remove staff members.</CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Staff Member</DialogTitle></DialogHeader>
            {/* Staff form will go here */}
            <p className="py-4 text-center text-muted-foreground">(Staff form UI to be implemented)</p>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
          <TableBody>
            {staff.map(member => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="capitalize">{member.role}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm">Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
export function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Settings</h1>
        <Tabs defaultValue="store-details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="store-details">Store Details</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
          </TabsList>
          <TabsContent value="store-details" className="mt-6">
            <StoreDetailsTab />
          </TabsContent>
          <TabsContent value="staff" className="mt-6">
            <StaffManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}