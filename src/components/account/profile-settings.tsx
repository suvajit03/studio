'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/components/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email(),
  location: z.string().min(2, 'Location is required'),
  avatar: z.string().url().or(z.literal('')),
  workTimeStart: z.string(),
  workTimeEnd: z.string(),
  offDays: z.array(z.number()).max(6, 'You must have at least one working day'),
});

const daysOfWeek = [
  { id: 0, label: 'Sunday' },
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
];

export default function ProfileSettings() {
  const { user, updateUser } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      location: user.location,
      avatar: user.avatar,
      workTimeStart: user.workTime.start,
      workTimeEnd: user.workTime.end,
      offDays: user.offDays,
    },
  });
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  function onSubmit(data: z.infer<typeof profileFormSchema>) {
    updateUser({
        name: data.name,
        email: data.email,
        location: data.location,
        avatar: data.avatar,
        workTime: { start: data.workTimeStart, end: data.workTimeEnd },
        offDays: data.offDays
    });
    toast({
      title: 'Profile updated',
      description: 'Your changes have been saved successfully.',
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={form.watch('avatar')} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload Image</Button>
            </div>
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input placeholder="e.g. London, UK" {...field} /></FormControl>
                    <FormDescription>Used for weather reports and time zone adjustments.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        
        <Separator/>

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Work Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="workTimeStart"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Work Time Start</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="workTimeEnd"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Work Time End</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="offDays"
                render={() => (
                    <FormItem>
                    <FormLabel>Weekly Off Days</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {daysOfWeek.map((item) => (
                        <FormField
                            key={item.id}
                            control={form.control}
                            name="offDays"
                            render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                            (value) => value !== item.id
                                            )
                                        );
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
                            </FormItem>
                            )}
                        />
                        ))}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>
        
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}
