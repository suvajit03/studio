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
        <div className="flex-grow overflow-hidden">
            <Tabs defaultValue="profile" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile & Work</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="flex-grow overflow-y-auto mt-4 pr-2">
                <ProfileSettings />
            </TabsContent>
            <TabsContent value="contacts" className="flex-grow overflow-y-auto mt-4 pr-2">
                <ContactSettings />
            </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
