
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
    { value: "tokyo, japan", label: "Tokyo, Japan" },
    { value: "delhi, india", label: "Delhi, India" },
    { value: "shanghai, china", label: "Shanghai, China" },
    { value: "sao paulo, brazil", label: "São Paulo, Brazil" },
    { value: "mumbai, india", label: "Mumbai, India" },
    { value: "mexico city, mexico", label: "Mexico City, Mexico" },
    { value: "beijing, china", label: "Beijing, China" },
    { value: "osaka, japan", label: "Osaka, Japan" },
    { value: "cairo, egypt", label: "Cairo, Egypt" },
    { value: "new york, usa", label: "New York, USA" },
    { value: "dhaka, bangladesh", label: "Dhaka, Bangladesh" },
    { value: "karachi, pakistan", label: "Karachi, Pakistan" },
    { value: "buenos aires, argentina", label: "Buenos Aires, Argentina" },
    { value: "kolkata, india", label: "Kolkata, India" },
    { value: "istanbul, turkey", label: "Istanbul, Turkey" },
    { value: "chongqing, china", label: "Chongqing, China" },
    { value: "lagos, nigeria", label: "Lagos, Nigeria" },
    { value: "manila, philippines", label: "Manila, Philippines" },
    { value: "rio de janeiro, brazil", label: "Rio de Janeiro, Brazil" },
    { value: "tianjin, china", label: "Tianjin, China" },
    { value: "kinshasa, dr congo", label: "Kinshasa, DR Congo" },
    { value: "guangzhou, china", label: "Guangzhou, China" },
    { value: "los angeles, usa", label: "Los Angeles, USA" },
    { value: "moscow, russia", label: "Moscow, Russia" },
    { value: "shenzhen, china", label: "Shenzhen, China" },
    { value: "lahore, pakistan", label: "Lahore, Pakistan" },
    { value: "bangalore, india", label: "Bangalore, India" },
    { value: "paris, france", label: "Paris, France" },
    { value: "bogota, colombia", label: "Bogotá, Colombia" },
    { value: "jakarta, indonesia", label: "Jakarta, Indonesia" },
    { value: "chennai, india", label: "Chennai, India" },
    { value: "lima, peru", label: "Lima, Peru" },
    { value: "bangkok, thailand", label: "Bangkok, Thailand" },
    { value: "seoul, south korea", label: "Seoul, South Korea" },
    { value: "nagoya, japan", label: "Nagoya, Japan" },
    { value: "hyderabad, india", label: "Hyderabad, India" },
    { value: "london, uk", label: "London, UK" },
    { value: "tehran, iran", label: "Tehran, Iran" },
    { value: "chicago, usa", label: "Chicago, USA" },
    { value: "chengdu, china", label: "Chengdu, China" },
    { value: "nanjing, china", label: "Nanjing, China" },
    { value: "wuhan, china", label: "Wuhan, China" },
    { value: "ho chi minh city, vietnam", label: "Ho Chi Minh City, Vietnam" },
    { value: "hangzhou, china", label: "Hangzhou, China" },
    { value: "ahmedabad, india", label: "Ahmedabad, India" },
    { value: "kuala lumpur, malaysia", label: "Kuala Lumpur, Malaysia" },
    { value: "xian, china", label: "Xi'an, China" },
    { value: "dongguan, china", label: "Dongguan, China" },
    { value: "foshan, china", label: "Foshan, China" },
    { value: "shenyang, china", label: "Shenyang, China" },
    { value: "riyadh, saudi arabia", label: "Riyadh, Saudi Arabia" },
    { value: "baghdad, iraq", label: "Baghdad, Iraq" },
    { value: "santiago, chile", label: "Santiago, Chile" },
    { value: "madrid, spain", label: "Madrid, Spain" },
    { value: "toronto, canada", label: "Toronto, Canada" },
    { value: "miami, usa", label: "Miami, USA" },
    { value: "houston, usa", label: "Houston, USA" },
    { value: "dallas, usa", label: "Dallas, USA" },
    { value: "atlanta, usa", label: "Atlanta, USA" },
    { value: "philadelphia, usa", label: "Philadelphia, USA" },
    { value: "washington dc, usa", label: "Washington D.C., USA" },
    { value: "boston, usa", label: "Boston, USA" },
    { value: "phoenix, usa", label: "Phoenix, USA" },
    { value: "detroit, usa", label: "Detroit, USA" },
    { value: "san francisco, usa", label: "San Francisco, USA" },
    { value: "seattle, usa", label: "Seattle, USA" },
    { value: "san diego, usa", label: "San Diego, USA" },
    { value: "minneapolis, usa", label: "Minneapolis, USA" },
    { value: "tampa, usa", label: "Tampa, USA" },
    { value: "denver, usa", label: "Denver, USA" },
    { value: "baltimore, usa", label: "Baltimore, USA" },
    { value: "las vegas, usa", label: "Las Vegas, USA" },
    { value: "st louis, usa", label: "St. Louis, USA" },
    { value: "portland, usa", "label": "Portland, USA" },
    { value: "orlando, usa", label: "Orlando, USA" },
    { value: "sacramento, usa", label: "Sacramento, USA" },
    { value: "san antonio, usa", label: "San Antonio, USA" },
    { value: "pittsburgh, usa", label: "Pittsburgh, USA" },
    { value: "san jose, usa", label: "San Jose, USA" },
    { value: "cincinnati, usa", label: "Cincinnati, USA" },
    { value: "cleveland, usa", label: "Cleveland, USA" },
    { value: "kansas city, usa", label: "Kansas City, USA" },
    { value: "austin, usa", label: "Austin, USA" },
    { value: "columbus, usa", label: "Columbus, USA" },
    { value: "charlotte, usa", label: "Charlotte, USA" },
    { value: "indianapolis, usa", label: "Indianapolis, USA" },
    { value: "nashville, usa", label: "Nashville, USA" },
    { value: "virginia beach, usa", label: "Virginia Beach, USA" },
    { value: "providence, usa", label: "Providence, USA" },
    { value: "milwaukee, usa", label: "Milwaukee, USA" },
    { value: "jacksonville, usa", label: "Jacksonville, USA" },
    { value: "montreal, canada", label: "Montreal, Canada" },
    { value: "vancouver, canada", label: "Vancouver, Canada" },
    { value: "calgary, canada", label: "Calgary, Canada" },
    { value: "edmonton, canada", label: "Edmonton, Canada" },
    { value: "ottawa, canada", label: "Ottawa, Canada" },
    { value: "quebec city, canada", label: "Quebec City, Canada" },
    { value: "winnipeg, canada", label: "Winnipeg, Canada" },
    { value: "hamilton, canada", label: "Hamilton, Canada" },
    { value: "berlin, germany", label: "Berlin, Germany" },
    { value: "hamburg, germany", label: "Hamburg, Germany" },
    { value: "munich, germany", label: "Munich, Germany" },
    { value: "cologne, germany", label: "Cologne, Germany" },
    { value: "frankfurt, germany", label: "Frankfurt, Germany" },
    { value: "stuttgart, germany", label: "Stuttgart, Germany" },
    { value: "dusseldorf, germany", label: "Dusseldorf, Germany" },
    { value: "dortmund, germany", label: "Dortmund, Germany" },
    { value: "essen, germany", label: "Essen, Germany" },
    { value: "leipzig, germany", label: "Leipzig, Germany" },
    { value: "bremen, germany", label: "Bremen, Germany" },
    { value: "dresden, germany", label: "Dresden, Germany" },
    { value: "hanover, germany", label: "Hanover, Germany" },
    { value: "nuremberg, germany", label: "Nuremberg, Germany" },
    { value: "sydney, australia", label: "Sydney, Australia" },
    { value: "melbourne, australia", label: "Melbourne, Australia" },
    { value: "brisbane, australia", label: "Brisbane, Australia" },
    { value: "perth, australia", label: "Perth, Australia" },
    { value: "adelaide, australia", label: "Adelaide, Australia" },
    { value: "gold coast, australia", label: "Gold Coast, Australia" },
    { value: "canberra, australia", label: "Canberra, Australia" },
    { value: "newcastle, australia", label: "Newcastle, Australia" },
    { value: "wollongong, australia", label: "Wollongong, Australia" },
    { value: "geelong, australia", label: "Geelong, Australia" },
    { value: "hobart, australia", label: "Hobart, Australia" },
    { value: "sunshine coast, australia", label: "Sunshine Coast, Australia" },
    { value: "cairns, australia", label: "Cairns, Australia" },
    { value: "dubai, uae", label: "Dubai, UAE" },
    { value: "abu dhabi, uae", label: "Abu Dhabi, UAE" },
    { value: "sharjah, uae", label: "Sharjah, UAE" },
    { value: "al ain, uae", label: "Al Ain, UAE" },
    { value: "ajman, uae", label: "Ajman, UAE" },
    { value: "singapore", label: "Singapore" },
    { value: "hong kong", label: "Hong Kong" },
]

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

    

    