'use client';
import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Menu, X } from 'lucide-react';
import MyCalendar from '@/components/dashboard/my-calendar';
import WeatherReport from '@/components/dashboard/weather-report';
import UpcomingMeetings from '@/components/dashboard/upcoming-meetings';
import AuthButton from '@/components/auth/auth-button';
import ChatbotWindow from '@/components/chatbot/chatbot-window';

export function MainLayout() {
  const [isChatOpen, setChatOpen] = useState(false);

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
                <SidebarTrigger className="md:hidden">
                    <Button variant="ghost" size="icon"><Menu /></Button>
                </SidebarTrigger>
                <h1 className="hidden text-2xl font-bold md:block font-headline text-primary">
                  MeetAI
                </h1>
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
        <Button size="icon" className="rounded-full w-14 h-14 shadow-lg" onClick={() => setChatOpen(!isChatOpen)}>
          {isChatOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
          <span className="sr-only">Toggle Chatbot</span>
        </Button>
      </div>

      {isChatOpen && <ChatbotWindow onClose={() => setChatOpen(false)} />}
    </SidebarProvider>
  );
}
