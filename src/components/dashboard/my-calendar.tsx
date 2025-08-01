'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useUser } from '@/components/providers/user-provider';
import { Badge } from '@/components/ui/badge';
import { isSameDay, format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Meeting } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Users } from 'lucide-react';

export default function MyCalendar() {
  const { user } = useUser();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setDialogOpen] = useState(false);

  const meetingDates = useMemo(() => user.meetings.map(m => m.date), [user.meetings]);
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const getParticipantDetails = (participantIds: string[]) => {
    return participantIds.map(id => user.contacts.find(c => c.id === id)).filter(Boolean);
  }

  const meetingsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return user.meetings.filter(m => isSameDay(m.date, selectedDate));
  }, [selectedDate, user.meetings]);


  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const meetingsExist = meetingDates.some(md => isSameDay(date, md));
    if (meetingsExist) {
        setSelectedDate(date);
        setDialogOpen(true);
    } else {
        setSelectedDate(date);
    }
  }

  const modifiers = {
    offDay: (date: Date) => user.offDays.includes(date.getDay()),
    meetingDay: (date: Date) => meetingDates.some(md => isSameDay(date, md)),
  };

  const modifiersStyles = {
    offDay: {
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
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
                <div className="w-4 h-4 rounded-sm bg-muted"></div>
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
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Meetings for {selectedDate && format(selectedDate, 'PPP')}</DialogTitle>
                 <DialogDescription>
                    You have {meetingsOnSelectedDate.length} meeting(s) scheduled on this day.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto -mr-4 pr-4">
                {meetingsOnSelectedDate.map(meeting => (
                     <Card key={meeting.id} className="bg-background/50">
                        <CardContent className="p-3">
                            <h4 className="font-semibold">{meeting.title}</h4>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <span>{format(meeting.date, "h:mm a")}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                 <Users className="h-4 w-4 text-muted-foreground" />
                                 <div className="flex -space-x-2 overflow-hidden">
                                    {getParticipantDetails(meeting.participants).map(p => p && (
                                        <Avatar key={p.id} className="inline-block h-6 w-6 border-2 border-card">
                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${p.email}`} />
                                            <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                                        </Avatar>
                                    ))}
                                </div>
                            </div>
                            {meeting.notes && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">{meeting.notes}</p>}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
