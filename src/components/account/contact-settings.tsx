'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/components/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash, User as UserIcon, Mail, Phone, FileText, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { Contact } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import StorageInspector from '../debug/storage-inspector';
import UserContextInspector from '../debug/user-context-inspector';

const contactSchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().optional(),
    email: z.string().email("Invalid email address"),
    number: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactSettings() {
    const { user, addContact, updateContact, deleteContact, refreshData } = useUser();
    const { toast } = useToast();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Debug and force refresh on mount
    useEffect(() => {
        console.log('🔧 ContactSettings mounted');
        console.log('👤 User logged in:', user.isLoggedIn);
        console.log('👤 User email:', user.email);
        console.log('📇 User contacts count:', user.contacts?.length || 0);
        console.log('📇 User contacts:', user.contacts);
    }, [user]);

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            email: '',
            number: '',
            description: ''
        }
    });

    const handleOpenForm = (contact: Contact | null = null) => {
        setEditingContact(contact);
        if (contact) {
            form.reset({
                name: contact.name || '',
                email: contact.email || '',
                number: contact.number || '',
                description: contact.description || ''
            });
        } else {
            form.reset({
                name: '',
                email: '',
                number: '',
                description: ''
            });
        }
        setFormOpen(true);
    };

    const onSubmit = async (data: ContactFormData) => {
        if (!user.isLoggedIn) {
            toast({
                title: 'Error',
                description: 'You must be logged in to manage contacts.',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);
        console.log('📝 Form submitted with data:', data);

        try {
            if (editingContact) {
                console.log('📝 Updating existing contact:', editingContact.id);
                updateContact({ ...editingContact, ...data });
                toast({
                    title: 'Contact Updated',
                    description: `${data.name} has been updated successfully.`
                });
            } else {
                console.log('➕ Adding new contact');
                addContact(data);
                toast({
                    title: 'Contact Added',
                    description: `${data.name} has been added to your contacts.`
                });
            }
            setFormOpen(false);
            setEditingContact(null);
            
            // Force refresh after a short delay to ensure state is updated
            setTimeout(() => {
                refreshData();
            }, 200);
            
        } catch (error) {
            console.error('❌ Error saving contact:', error);
            toast({
                title: 'Error',
                description: 'Failed to save contact. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteContact = (contactId: string, contactName: string) => {
        if (!user.isLoggedIn) {
            toast({
                title: 'Error',
                description: 'You must be logged in to delete contacts.',
                variant: 'destructive'
            });
            return;
        }

        console.log('🗑️ Deleting contact:', contactId);
        deleteContact(contactId);
        toast({
            title: 'Contact Deleted',
            description: `${contactName} has been removed from your contacts.`
        });
        
        // Force refresh after deletion
        setTimeout(() => {
            refreshData();
        }, 200);
    };

    const handleForceRefresh = () => {
        console.log('🔄 Force refreshing contacts data');
        refreshData();
        toast({
            title: 'Refreshed',
            description: 'Contact data has been refreshed.'
        });
    };

    // Show loading state if user data is being loaded
    if (!user.isLoggedIn) {
        return (
            <div className="text-center p-8">
                <p className="text-muted-foreground">Please log in to manage your contacts.</p>
            </div>
        );
    }

    const contacts = user.contacts || [];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Your Contacts</h3>
                    <span className="text-sm text-muted-foreground">({contacts.length})</span>
                </div>
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleForceRefresh}
                        title="Refresh contact data"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleOpenForm()}>
                        <Plus className="mr-2 h-4 w-4" /> Add Contact
                    </Button>
                </div>
            </div>
            
            {/* Debug info */}
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                <p>Debug: User logged in: {user.isLoggedIn ? 'Yes' : 'No'} | Email: {user.email} | Contacts: {contacts.length}</p>
            </div>
            
            <div className="space-y-3">
                {contacts.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h4 className="text-lg font-medium mb-2">No contacts yet</h4>
                            <p className="text-muted-foreground mb-4">
                                Start building your contact list by adding your first contact.
                            </p>
                            <Button onClick={() => handleOpenForm()}>
                                <Plus className="mr-2 h-4 w-4" /> Add Your First Contact
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    contacts.map((contact) => (
                        <Card key={contact.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex justify-between items-start">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="bg-primary/10 rounded-full p-2 mt-1">
                                        <UserIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-lg">{contact.name}</p>
                                        <div className="text-sm text-muted-foreground flex flex-col gap-1 mt-1">
                                            <span className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 shrink-0"/>
                                                <span className="truncate">{contact.email}</span>
                                            </span>
                                            {contact.number && (
                                                <span className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 shrink-0"/>
                                                    <span>{contact.number}</span>
                                                </span>
                                            )}
                                        </div>
                                        {contact.description && (
                                            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t flex items-start gap-2">
                                                <FileText className="h-3 w-3 mt-0.5 shrink-0"/> 
                                                <span className="line-clamp-2">{contact.description}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1 ml-4">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleOpenForm(contact)}
                                        title="Edit contact"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                title="Delete contact"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Delete Contact</DialogTitle>
                                            </DialogHeader>
                                            <p>Are you sure you want to delete <strong>{contact.name}</strong>? This action cannot be undone.</p>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <DialogClose asChild>
                                                    <Button 
                                                        variant="destructive" 
                                                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingContact ? 'Edit' : 'Add'} Contact</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField 
                                control={form.control} 
                                name="name" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter full name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                            <FormField 
                                control={form.control} 
                                name="email" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="Enter email address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                            <FormField 
                                control={form.control} 
                                name="number" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="Enter phone number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                            <FormField 
                                control={form.control} 
                                name="description" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="e.g. Project Manager, Friend, Client..." 
                                                rows={3}
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                            <DialogFooter className="gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setFormOpen(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingContact ? 'Update' : 'Add'} Contact
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            
            <UserContextInspector />
            <StorageInspector />
        </div>
    );
}
