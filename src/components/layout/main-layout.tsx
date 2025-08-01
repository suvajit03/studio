'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Menu } from 'lucide-react';
import AuthButton from '@/components/auth/auth-button';
import Chatbot from '@/components/chatbot/chatbot';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import MyCalendar from '../dashboard/my-calendar';
import WeatherReport from '../dashboard/weather-report';
import UpcomingMeetings from '../dashboard/upcoming-meetings';
import { useUser } from '../providers/user-provider';
import AccountSettingsDialog from '../account/account-settings-dialog';

export function MainLayout() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { showOnboarding, setShowOnboarding } = useUser();

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
      <>
      <div className="h-screen w-full bg-background flex flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between gap-2 sm:gap-4 px-2 sm:px-8">
              <div className="flex items-center gap-2">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                        <Menu />
                        <span className="sr-only">Open Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] sm:max-w-md flex flex-col">
                        <SheetHeader>
                            <SheetTitle>Dashboard</SheetTitle>
                        </SheetHeader>
                        <SidePanelContent/>
                    </SheetContent>
                </Sheet>
                 <h1 className="text-xl font-bold font-headline text-primary flex items-center gap-2">
                  <Bot />
                  MeetAI
                </h1>
              </div>
              
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
      <AccountSettingsDialog open={showOnboarding} onOpenChange={setShowOnboarding} />
    </>
  );
}
