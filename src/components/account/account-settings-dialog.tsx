'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileSettings from './profile-settings';
import ContactSettings from './contact-settings';

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your profile, work schedule, and contacts.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="profile" className="flex-grow flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile & Work</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="flex-grow overflow-y-auto mt-4 -mr-6 pr-6">
            <ProfileSettings />
        </TabsContent>
        <TabsContent value="contacts" className="flex-grow overflow-y-auto mt-4 -mr-6 pr-6">
            <ContactSettings />
        </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
