'use client';
import { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Menu, X, Bell, Calendar, Sun } from 'lucide-react';
import UpcomingMeetings from '@/components/dashboard/upcoming-meetings';
import AuthButton from '@/components/auth/auth-button';
import Chatbot from '@/components/chatbot/chatbot';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUser } from '../providers/user-provider';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import MyCalendar from '../dashboard/my-calendar';
import WeatherReport from '../dashboard/weather-report';

export function MainLayout() {
  const { user } = useUser();
  const futureMeetings = user.meetings.filter((m) => m.date >= new Date());
  
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  return (
    <SidebarProvider>
      <div className="h-screen w-full bg-background flex flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold md:block font-headline text-primary">
                  MeetAI
                </h1>
              </div>
              
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost">
                                <Calendar className="mr-2 h-4 w-4" />
                                My Calendar
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto">
                            <MyCalendar/>
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost">
                                <Sun className="mr-2 h-4 w-4" />
                                Weather
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto">
                           <WeatherReport/>
                        </PopoverContent>
                    </Popover>
                </div>
              </div>


              <div className="flex items-center gap-4">
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Bell />
                      <span className="sr-only">Notifications</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <Tabs defaultValue="notifications" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="notifications">
                          Notifications
                        </TabsTrigger>
                        <TabsTrigger value="meetings">Meetings</TabsTrigger>
                      </TabsList>
                      <TabsContent value="notifications">
                        <div className="flex flex-col gap-2 pt-2">
                          <div className="flex items-center gap-2 rounded-md border p-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                              <AvatarFallback>AD</AvatarFallback>
                            </Avatar>
                            <p className="text-sm">
                              <span className="font-semibold">Alex Doe</span>{' '}
                              sent you a message.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 rounded-md border p-2">
                            <Avatar className="h-8 w-8">
                               <AvatarImage src="https://i.pravatar.cc/150?u=jane.smith@example.com" />
                              <AvatarFallback>JS</AvatarFallback>
                            </Avatar>
                            <p className="text-sm">
                              <span className="font-semibold">Jane Smith</span>{' '}
                              accepted your meeting invitation.
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="meetings">
                        <div className="flex flex-col gap-2 pt-2">
                          {futureMeetings.length > 0 ? (
                            futureMeetings.map((meeting) => (
                              <div
                                key={meeting.id}
                                className="flex flex-col gap-2 rounded-md border p-2"
                              >
                                <p className="font-semibold">{meeting.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(
                                    meeting.date,
                                    "EEE, MMM d 'at' h:mm a"
                                  )}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground p-4 text-center">
                              No upcoming meetings.
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </PopoverContent>
                </Popover>
                <AuthButton />
              </div>
            </div>
        </header>

        <div className="flex-grow flex overflow-hidden">
            <main className="flex-1 flex p-4">
                <Chatbot />
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
