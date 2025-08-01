
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
import { Check, ChevronsUpDown, Loader2, MapPin, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateAvatar } from '@/ai/flows/generate-avatar';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';

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

const locations = [
    { value: "london, uk", label: "London, UK" },
    { value: "new york, usa", label: "New York, USA" },
    { value: "tokyo, japan", label: "Tokyo, Japan" },
    { value: "paris, france", label: "Paris, France" },
    { value: "sydney, australia", label: "Sydney, Australia" },
    { value: "dubai, uae", label: "Dubai, UAE" },
    { value: "singapore", label: "Singapore" },
    { value: "toronto, canada", label: "Toronto, Canada" },
    { value: "san francisco, usa", label: "San Francisco, USA" },
    { value: "berlin, germany", label: "Berlin, Germany" },
    { value: "hong kong", label: "Hong Kong" },
    { value: "chicago, usa", label: "Chicago, USA" },
]

export default function ProfileSettings() {
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarDescription, setAvatarDescription] = useState('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);


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

  const handleGenerateAvatar = async () => {
    if (!avatarDescription.trim()) {
        toast({ title: 'Error', description: 'Please provide a description for your avatar.', variant: 'destructive' });
        return;
    }
    setIsGeneratingAvatar(true);
    try {
        const { avatarDataUri } = await generateAvatar({ description: avatarDescription });
        form.setValue('avatar', avatarDataUri);
        setAvatarDialogOpen(false);
        toast({ title: 'Avatar Generated!', description: 'Your new avatar has been set.'});
    } catch (error) {
        console.error('Avatar generation failed:', error);
        toast({ title: 'Error', description: 'Failed to generate avatar. Please try again.', variant: 'destructive' });
    } finally {
        setIsGeneratingAvatar(false);
    }
  }

  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
        toast({ title: "Geolocation not supported", description: "Your browser doesn't support geolocation.", variant: "destructive" });
        return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch location name');
                }
                const data = await response.json();
                if (data.length > 0) {
                    const locationName = `${data[0].name}, ${data[0].country}`;
                    form.setValue('location', locationName.toLowerCase());
                    toast({ title: "Location updated!", description: `Your location has been set to ${locationName}.` });
                } else {
                    toast({ title: "Could not find location", description: "We couldn't determine your city from your coordinates.", variant: "destructive" });
                }
            } catch (error) {
                console.error("Reverse geocoding error:", error);
                toast({ title: "Error fetching location", description: "Could not get location name. Please try again.", variant: "destructive" });
            } finally {
                setIsFetchingLocation(false);
            }
        },
        (error) => {
            console.error("Geolocation error:", error);
            toast({ title: "Geolocation failed", description: "Could not get your location. Please ensure you've given permission.", variant: "destructive" });
            setIsFetchingLocation(false);
        }
    )

  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={form.watch('avatar')} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" onClick={() => setAvatarDialogOpen(true)}><Upload className="mr-2 h-4 w-4" /> Generate Avatar</Button>
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
                    <FormItem className="flex flex-col">
                        <FormLabel>Location</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                "w-full justify-between capitalize",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value
                                ? locations.find(l => l.value === field.value)?.label ?? field.value
                                : "Select location"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search location..." />
                                <CommandList>
                                    <CommandEmpty>No location found.</CommandEmpty>
                                    <CommandGroup>
                                        {locations.map((location) => (
                                        <CommandItem
                                            value={location.label}
                                            key={location.value}
                                            onSelect={() => {
                                                form.setValue("location", location.value)
                                            }}
                                        >
                                            <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                location.value === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                            />
                                            {location.label}
                                        </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                        </Popover>
                        <Button type="button" variant="link" size="sm" className="self-start px-1" onClick={handleFetchCurrentLocation} disabled={isFetchingLocation}>
                            {isFetchingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MapPin className="mr-2 h-4 w-4"/>}
                            {isFetchingLocation ? 'Fetching...' : 'Use my current location'}
                        </Button>
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

    <Dialog open={isAvatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Generate AI Avatar</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <p>Describe your desired avatar. Be as specific as you like!</p>
                <Textarea 
                    placeholder="e.g., A friendly cartoon robot with a blue helmet..."
                    value={avatarDescription}
                    onChange={(e) => setAvatarDescription(e.target.value)}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar}>
                    {isGeneratingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Generate'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

    