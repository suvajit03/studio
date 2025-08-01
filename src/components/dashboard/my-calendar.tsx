'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useUser } from '@/components/providers/user-provider';
import { isSameDay, format, startOfDay } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { Meeting } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '@/components/ui/button';
import { Sun, Cloud, CloudRain, CloudSnow, Users, Trash, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Checkbox } from '../ui/checkbox';

interface WeatherInfo {
    temp: string;
    condition: string;
    icon: JSX.Element;
}

const getWeatherIcon = (condition: string) => {
    const s = `h-6 w-6`;
    const lowerCaseCondition = condition.toLowerCase();
    if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear')) return <Sun className={`${s} text-yellow-400`} />;
    if (lowerCaseCondition.includes('cloud') || lowerCaseCondition.includes('overcast')) return <Cloud className={`${s} text-gray-400`} />;
    if (lowerCaseCondition.includes('rain')) return <CloudRain className={`${s} text-blue-400`} />;
    if (lowerCaseCondition.includes('snow')) return <CloudSnow className={`${s} text-white`} />;
    return <Sun className={`${s} text-yellow-400`} />;
}

const meetingFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  time: z.string().min(1, "Time is required"),
  participants: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingFormSchema>;

export default function MyCalendar() {
  const { user, addMeeting, deleteMeeting } = useUser();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: { title: '', time: '10:00', participants: [], notes: '' },
  });

  const fetchWeatherForDate = async (date: Date) => {
    if (!user.location) return;
    setLoadingWeather(true);
    try {
      const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.NEXT_PUBLIC_WEATHERAPI_KEY}&q=${user.location}&dt=${format(date, 'yyyy-MM-dd')}`);
       if (!response.ok) throw new Error('Failed to fetch weather forecast');
      const data = await response.json();
      const forecast = data.forecast?.forecastday[0];

      if (forecast) {
        setWeather({
          temp: `${Math.round(forecast.day.avgtemp_c)}°C`,
          condition: forecast.day.condition.text,
          icon: getWeatherIcon(forecast.day.condition.text),
        });
      } else {
        setWeather(null);
      }
    } catch (error) {
      console.error(error);
      setWeather(null);
    } finally {
      setLoadingWeather(false);
    }
  };
  
  const meetingDates = useMemo(() => user.meetings.map(m => m.date), [user.meetings]);
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const getParticipantDetails = (participantIds: string[]) => {
    return participantIds.map(id => user.contacts.find(c => c.id === id)).filter(Boolean);
  }

  const meetingsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return user.meetings
      .filter(m => isSameDay(m.date, selectedDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selectedDate, user.meetings]);


  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    fetchWeatherForDate(date);
    setDialogOpen(true);
  }

  const onSubmitMeeting = (data: MeetingFormData) => {
    if (!selectedDate) return;
    
    const [hours, minutes] = data.time.split(':');
    const meetingDate = new Date(selectedDate);
    meetingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    addMeeting({
      title: data.title,
      date: meetingDate.toISOString(),
      participants: data.participants || [],
      notes: data.notes,
    });
    toast({ title: 'Meeting Scheduled!', description: `"${data.title}" has been added to your calendar.`});
    setFormOpen(false);
    form.reset();
  }

  const modifiers = {
    offDay: (date: Date) => user.offDays.includes(date.getDay()),
    meetingDay: (date: Date) => meetingDates.some(md => isSameDay(date, md)),
  };

  const modifiersStyles = {
    offDay: {
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
      opacity: 0.5,
    },
    meetingDay: {
      position: 'relative' as const,
      fontWeight: 'bold',
    },
  };

  const MeetingDot = () => (
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
  );

  return (
    <>
    <Card className={isMobile ? "border-0 shadow-none" : ""}>
      <CardHeader>
        <CardTitle>My Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-8 items-center justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => date < startOfDay(new Date())}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          components={{
            DayContent: (props) => {
              const originalContent = <div className="relative w-full h-full flex items-center justify-center">{props.date.getDate()}</div>;
              if (modifiers.meetingDay(props.date)) {
                return <div className="relative w-full h-full flex items-center justify-center">{props.date.getDate()}<MeetingDot /></div>;
              }
              return originalContent;
            },
          }}
          className="rounded-md border"
        />
        <div className="flex flex-col gap-2 self-start">
            <h4 className="font-semibold">Legend</h4>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border border-primary bg-primary/20"></div>
                <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-muted opacity-50"></div>
                <span>Off Day</span>
            </div>
             <div className="flex items-center gap-2">
                <div className="relative w-4 h-4 rounded-sm border"><MeetingDot/></div>
                <span>Meeting Day</span>
            </div>
        </div>
      </CardContent>
    </Card>

    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{selectedDate && format(selectedDate, 'PPP')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-base">Daily Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 grid gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Weather</span>
                             {loadingWeather && <Loader2 className="h-4 w-4 animate-spin" />}
                            {!loadingWeather && weather && (
                                <div className="flex items-center gap-2">
                                    {weather.icon}
                                    <span className="font-semibold">{weather.temp}</span>
                                    <span className="text-sm text-muted-foreground">{weather.condition}</span>
                                </div>
                            )}
                             {!loadingWeather && !weather && <span className="text-sm text-muted-foreground">No forecast available</span>}
                        </div>
                        <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                          <DialogTrigger asChild>
                             <Button><Plus className="mr-2 h-4 w-4" /> Schedule Meeting</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Meeting on {selectedDate && format(selectedDate, 'PPP')}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitMeeting)} className="space-y-4">
                                  <FormField control={form.control} name="title" render={({ field }) => (
                                      <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name="time" render={({ field }) => (
                                      <FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField
                                    control={form.control}
                                    name="participants"
                                    render={() => (
                                      <FormItem>
                                        <FormLabel>Participants</FormLabel>
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start font-normal">
                                                    Select participants...
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                              <Command>
                                                <CommandInput placeholder="Search contacts..." />
                                                <CommandList>
                                                  <CommandEmpty>No contacts found.</CommandEmpty>
                                                  <CommandGroup>
                                                    {user.contacts.map(contact => (
                                                        <FormField
                                                            key={contact.id}
                                                            control={form.control}
                                                            name="participants"
                                                            render={({ field }) => (
                                                                <CommandItem
                                                                    onSelect={() => {
                                                                        const currentValue = field.value || [];
                                                                        const isChecked = currentValue.includes(contact.id);
                                                                        const newValue = isChecked
                                                                            ? currentValue.filter(id => id !== contact.id)
                                                                            : [...currentValue, contact.id];
                                                                        field.onChange(newValue);
                                                                    }}
                                                                >
                                                                    <Checkbox checked={field.value?.includes(contact.id)} className="mr-2"/>
                                                                    {contact.name}
                                                                </CommandItem>
                                                            )}
                                                        />
                                                    ))}
                                                  </CommandGroup>
                                                </CommandList>
                                              </Command>
                                            </PopoverContent>
                                         </Popover>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField control={form.control} name="notes" render={({ field }) => (
                                      <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <DialogFooter>
                                      <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                                      <Button type="submit">Add Meeting</Button>
                                  </DialogFooter>
                                </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
                
                <h4 className="font-semibold text-sm text-muted-foreground">Meetings on this day</h4>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto -mr-4 pr-4">
                  {meetingsOnSelectedDate.length > 0 ? meetingsOnSelectedDate.map(meeting => (
                       <Card key={meeting.id} className="bg-background/50 group relative">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Meeting</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete the meeting "{meeting.title}"? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                        <Button variant="destructive" onClick={() => deleteMeeting(meeting.id)}>Delete</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <CardContent className="p-3">
                              <h4 className="font-semibold pr-8">{meeting.title}</h4>
                              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                  <span>{format(meeting.date, "h:mm a")}</span>
                              </div>
                              {meeting.participants.length > 0 && <div className="flex items-center gap-2 mt-2">
                                   <Users className="h-4 w-4 text-muted-foreground" />
                                   <div className="flex -space-x-2 overflow-hidden">
                                      {getParticipantDetails(meeting.participants).map(p => p && (
                                          <Avatar key={p.id} className="inline-block h-6 w-6 border-2 border-card">
                                              <AvatarImage src={`https://i.pravatar.cc/150?u=${p.email}`} />
                                              <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                                          </Avatar>
                                      ))}
                                  </div>
                              </div>}
                              {meeting.notes && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">{meeting.notes}</p>}
                          </CardContent>
                      </Card>
                  )) : (
                    <p className="text-sm text-center text-muted-foreground py-4">No meetings scheduled.</p>
                  )}
              </div>
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
