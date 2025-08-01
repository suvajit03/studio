'use client';
import { useState } from 'react';
import { useUser } from '@/components/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash, User as UserIcon, Mail, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { Contact } from '@/lib/types';

const contactSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    number: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactSettings() {
    const { user, addContact, updateContact, deleteContact } = useUser();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    const handleOpenForm = (contact: Contact | null = null) => {
        setEditingContact(contact);
        form.reset(contact || { name: '', email: '', number: '' });
        setFormOpen(true);
    };

    const onSubmit = (data: ContactFormData) => {
        if (editingContact) {
            updateContact({ ...editingContact, ...data });
        } else {
            addContact(data);
        }
        setFormOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Your Contacts</h3>
                <Button size="sm" onClick={() => handleOpenForm()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Contact
                </Button>
            </div>
            
            <div className="space-y-3">
                {user.contacts.map((contact) => (
                    <Card key={contact.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="bg-muted rounded-full p-2">
                                    <UserIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-semibold">{contact.name}</p>
                                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                                       <span className="flex items-center gap-1"><Mail className="h-3 w-3"/>{contact.email}</span>
                                       {contact.number && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/>{contact.number}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenForm(contact)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Are you sure?</DialogTitle>
                                        </DialogHeader>
                                        <p>This will permanently delete the contact for {contact.name}.</p>
                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                            <DialogClose asChild><Button variant="destructive" onClick={() => deleteContact(contact.id)}>Delete</Button></DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

             <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingContact ? 'Edit' : 'Add'} Contact</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="number" render={({ field }) => (
                                <FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                                <Button type="submit">Save Contact</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
