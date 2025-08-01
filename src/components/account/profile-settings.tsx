
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
import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import _ from 'lodash';

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

interface LocationResult {
    id: number;
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    url: string;
}

interface ProfileSettingsProps {
    onSaveChanges: () => void;
}

export default function ProfileSettings({ onSaveChanges }: ProfileSettingsProps) {
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarDescription, setAvatarDescription] = useState('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [isLocationPopoverOpen, setLocationPopoverOpen] = useState(false);

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
    onSaveChanges();
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
                const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${process.env.NEXT_PUBLIC_WEATHERAPI_KEY}&q=${latitude},${longitude}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error.message || 'Failed to fetch location name');
                }
                const data = await response.json();
                if (data.location) {
                    const locationName = `${data.location.name}, ${data.location.country}`;
                    form.setValue('location', locationName);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedLocationSearch = useCallback(_.debounce(async (query: string) => {
    if (query.length < 2) {
        setLocationResults([]);
        setIsSearchingLocations(false);
        return;
    }
    setIsSearchingLocations(true);
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${process.env.NEXT_PUBLIC_WEATHERAPI_KEY}&q=${query}`);
        if (!response.ok) {
            throw new Error("Failed to fetch locations");
        }
        const data = await response.json();
        setLocationResults(data);
    } catch(e) {
        console.error(e);
        toast({ title: "Error", description: "Could not search for locations.", variant: "destructive"});
    } finally {
        setIsSearchingLocations(false);
    }
  }, 300), []);


  const handleLocationQueryChange = (query: string) => {
    setLocationQuery(query);
    debouncedLocationSearch(query);
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
                        <Popover open={isLocationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
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
                                        {field.value || "Select location"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput 
                                        placeholder="Search location..." 
                                        value={locationQuery}
                                        onValueChange={handleLocationQueryChange}
                                    />
                                    <CommandList>
                                        {isSearchingLocations && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
                                        {!isSearchingLocations && locationResults.length === 0 && locationQuery.length > 1 && <CommandEmpty>No location found.</CommandEmpty>}
                                        <CommandGroup>
                                            {locationResults.map((location) => {
                                                const locationName = `${location.name}, ${location.country}`;
                                                return (
                                                    <CommandItem
                                                        value={locationName}
                                                        key={location.id}
                                                        onSelect={() => {
                                                            form.setValue("location", locationName);
                                                            setLocationPopoverOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                locationName === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {locationName}
                                                    </CommandItem>
                                                )
                                            })}
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
