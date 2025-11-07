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
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { StaffForm, StaffFormData } from '@/components/settings/StaffForm';
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
  const queryClient = useQueryClient();
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const { data: staff, isLoading } = useQuery<StaffMember[]>({
    queryKey: ['staff'],
    queryFn: () => api('/api/staff'),
  });
  const createStaffMutation = useMutation({
    mutationFn: (newStaff: StaffFormData) => api<StaffMember>('/api/staff', { method: 'POST', body: JSON.stringify(newStaff) }),
    onSuccess: () => {
      toast.success('Staff member added successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setFormOpen(false);
    },
    onError: (error) => toast.error(`Failed to add staff: ${error.message}`),
  });
  const updateStaffMutation = useMutation({
    mutationFn: (updatedStaff: StaffMember) => api<StaffMember>(`/api/staff/${updatedStaff.id}`, { method: 'PUT', body: JSON.stringify(updatedStaff) }),
    onSuccess: () => {
      toast.success('Staff member updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setFormOpen(false);
      setSelectedStaff(null);
    },
    onError: (error) => toast.error(`Failed to update staff: ${error.message}`),
  });
  const deleteStaffMutation = useMutation({
    mutationFn: (staffId: string) => api(`/api/staff/${staffId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Staff member deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
    },
    onError: (error) => toast.error(`Failed to delete staff: ${error.message}`),
  });
  const handleAdd = () => {
    setSelectedStaff(null);
    setFormOpen(true);
  };
  const handleEdit = (member: StaffMember) => {
    setSelectedStaff(member);
    setFormOpen(true);
  };
  const handleDelete = (member: StaffMember) => {
    setSelectedStaff(member);
    setDeleteDialogOpen(true);
  };
  const handleFormSubmit = (data: StaffFormData) => {
    if (selectedStaff) {
      updateStaffMutation.mutate({ ...data, id: selectedStaff.id });
    } else {
      createStaffMutation.mutate(data);
    }
  };
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>Add, edit, or remove staff members.</CardDescription>
          </div>
          <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Staff</Button>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : staff?.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="capitalize">{member.role}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(member)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(member)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle></DialogHeader>
          <StaffForm
            staffMember={selectedStaff}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
            isSubmitting={createStaffMutation.isPending || updateStaffMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the staff member "{selectedStaff?.name}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedStaff && deleteStaffMutation.mutate(selectedStaff.id)} disabled={deleteStaffMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteStaffMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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