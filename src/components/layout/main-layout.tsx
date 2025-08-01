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
import { Bot, Menu, X, Bell } from 'lucide-react';
import MyCalendar from '@/components/dashboard/my-calendar';
import WeatherReport from '@/components/dashboard/weather-report';
import UpcomingMeetings from '@/components/dashboard/upcoming-meetings';
import AuthButton from '@/components/auth/auth-button';
import ChatbotWindow from '@/components/chatbot/chatbot-window';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUser } from '../providers/user-provider';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function MainLayout() {
  const [isChatOpen, setChatOpen] = useState(false);
  const { user } = useUser();
  const futureMeetings = user.meetings.filter((m) => m.date >= new Date());
  const getParticipantDetails = (participantIds: string[]) => {
    return participantIds
      .map((id) => user.contacts.find((c) => c.id === id))
      .filter(Boolean);
  };
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <h2 className="text-xl font-semibold font-headline">MeetAI</h2>
            </SidebarHeader>
            <UpcomingMeetings />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                  </Button>
                </SidebarTrigger>
                <h1 className="hidden text-2xl font-bold md:block font-headline text-primary">
                  MeetAI
                </h1>
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
              </div>

              <div className="flex-1 flex justify-center">
                <Tabs defaultValue="calendar" className="w-full max-w-md">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="calendar">My Calendar</TabsTrigger>
                    <TabsTrigger value="weather">Weather</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center gap-4">
                <AuthButton />
              </div>
            </div>
          </header>

          <main className="container py-8">
            <Tabs defaultValue="calendar" className="w-full">
              <TabsContent value="calendar" className="mt-0">
                <MyCalendar />
              </TabsContent>
              <TabsContent value="weather" className="mt-0">
                <WeatherReport />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => setChatOpen(!isChatOpen)}
        >
          {isChatOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Bot className="h-6 w-6" />
          )}
          <span className="sr-only">Toggle Chatbot</span>
        </Button>
      </div>

      {isChatOpen && <ChatbotWindow onClose={() => setChatOpen(false)} />}
    </SidebarProvider>
  );
}
