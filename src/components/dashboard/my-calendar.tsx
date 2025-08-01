'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useUser } from '@/components/providers/user-provider';
import { Badge } from '@/components/ui/badge';
import { isSameDay } from 'date-fns';

export default function MyCalendar() {
  const { user } = useUser();

  const meetingDates = useMemo(() => user.meetings.map(m => m.date), [user.meetings]);

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
    },
  };

  const MeetingDot = () => (
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-8 items-center justify-center">
        <Calendar
          mode="single"
          selected={new Date()}
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
        <div className="flex flex-col gap-2">
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
  );
}
