'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Bell, Calendar, Sun, Menu, Users } from 'lucide-react';
import AuthButton from '@/components/auth/auth-button';
import Chatbot from '@/components/chatbot/chatbot';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUser } from '../providers/user-provider';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import MyCalendar from '../dashboard/my-calendar';
import WeatherReport from '../dashboard/weather-report';
import UpcomingMeetings from '../dashboard/upcoming-meetings';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export function MainLayout() {
  const { user } = useUser();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const SidePanelContent = () => (
     <Tabs defaultValue="meetings" className="w-full mt-4 flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
        </TabsList>
        <TabsContent value="meetings" className="flex-grow overflow-y-auto mt-4 pr-2">
            <UpcomingMeetings />
        </TabsContent>
        <TabsContent value="calendar" className="flex-grow overflow-y-auto mt-4 pr-2">
            <MyCalendar/>
        </TabsContent>
        <TabsContent value="weather" className="flex-grow overflow-y-auto mt-4 pr-2">
            <WeatherReport/>
        </TabsContent>
    </Tabs>
  )

  return (
      <div className="h-screen w-full bg-background flex flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                {isMobile ? (
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                            <Menu />
                            <span className="sr-only">Open Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85vw] flex flex-col">
                            <SheetHeader>
                                <SheetTitle>Dashboard</SheetTitle>
                            </SheetHeader>
                            <SidePanelContent/>
                        </SheetContent>
                    </Sheet>
                ) : null}
                 <h1 className="text-xl font-bold font-headline text-primary">
                  MeetAI
                </h1>
              </div>
              
              {!isMobile && (
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-1 sm:gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:w-auto md:px-4">
                                    <Calendar className="h-4 w-4 md:mr-2" />
                                    <span className="hidden md:inline">My Calendar</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto">
                                <MyCalendar/>
                            </PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:w-auto md:px-4">
                                    <Sun className="h-4 w-4 md:mr-2" />
                                    <span className="hidden md:inline">Weather</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto">
                            <WeatherReport/>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <AuthButton />
              </div>
            </div>
        </header>

        <div className="flex-grow flex overflow-hidden">
            <main className="flex-1 flex p-0">
                <Chatbot />
            </main>
        </div>
      </div>
  );
}