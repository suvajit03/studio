'use client';
import { useUser } from '@/components/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isFuture } from 'date-fns';
import { Calendar, Users, Trash } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../ui/dialog';
import { useMemo } from 'react';

export default function UpcomingMeetings() {
    const { user, deleteMeeting } = useUser();
    const isMobile = useIsMobile();
    
    const futureMeetings = useMemo(() => {
        return user.meetings
            .filter(m => isFuture(m.date))
            .sort((a,b) => a.date.getTime() - b.date.getTime())
    }, [user.meetings]);

    const getParticipantDetails = (participantIds: string[]) => {
        return participantIds.map(id => user.contacts.find(c => c.id === id)).filter(Boolean);
    }
    
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <Card className={isMobile ? "border-0 shadow-none" : ""}>
            <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {futureMeetings.length > 0 ? futureMeetings.map(meeting => (
                        <Card key={meeting.id} className="bg-background/50 relative group">
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(meeting.date, "EEE, MMM d 'at' h:mm a")}</span>
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
                    )) : (
                        <p className="text-sm text-muted-foreground p-4 text-center">No upcoming meetings.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
