'use client';
import { useUser } from '@/components/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isFuture } from 'date-fns';
import { Calendar, Users, Trash, RefreshCw, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../ui/dialog';
import { useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import UserContextInspector from '../debug/user-context-inspector';

export default function UpcomingMeetings() {
    const { user, deleteMeeting, refreshData } = useUser();
    const isMobile = useIsMobile();
    const { toast } = useToast();
    
    // Debug logging
    useEffect(() => {
        console.log('📅 UpcomingMeetings mounted');
        console.log('👤 User logged in:', user.isLoggedIn);
        console.log('👤 User email:', user.email);
        console.log('📅 User meetings count:', user.meetings?.length || 0);
        console.log('📅 User meetings:', user.meetings);
    }, [user]);
    
    const futureMeetings = useMemo(() => {
        const meetings = user.meetings || [];
        console.log('📅 Filtering future meetings from:', meetings.length, 'total meetings');
        const filtered = meetings
            .filter(m => {
                const isFutureMeeting = isFuture(m.date);
                console.log('📅 Meeting', m.title, 'is future:', isFutureMeeting, 'date:', m.date);
                return isFutureMeeting;
            })
            .sort((a,b) => a.date.getTime() - b.date.getTime());
        console.log('📅 Found', filtered.length, 'future meetings');
        return filtered;
    }, [user.meetings]);

    const getParticipantDetails = (participantIds: string[]) => {
        return participantIds.map(id => user.contacts.find(c => c.id === id)).filter(Boolean);
    }
    
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    const handleDeleteMeeting = (meetingId: string, meetingTitle: string) => {
        if (!user.isLoggedIn) {
            toast({
                title: 'Error',
                description: 'You must be logged in to delete meetings.',
                variant: 'destructive'
            });
            return;
        }

        console.log('🗑️ Deleting meeting:', meetingId);
        deleteMeeting(meetingId);
        toast({
            title: 'Meeting Deleted',
            description: `"${meetingTitle}" has been removed from your calendar.`
        });
        
        // Force refresh after deletion
        setTimeout(() => {
            refreshData();
        }, 200);
    };

    const handleForceRefresh = () => {
        console.log('🔄 Force refreshing meetings data');
        refreshData();
        toast({
            title: 'Refreshed',
            description: 'Meeting data has been refreshed.'
        });
    };

    if (!user.isLoggedIn) {
        return (
            <Card className={isMobile ? "border-0 shadow-none" : ""}>
                <CardHeader>
                    <CardTitle>Upcoming Meetings</CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                    <p className="text-muted-foreground">Please log in to view your meetings.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={isMobile ? "border-0 shadow-none" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2">
                    Upcoming Meetings
                    <span className="text-sm font-normal text-muted-foreground">
                        ({futureMeetings.length})
                    </span>
                </CardTitle>
                <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleForceRefresh}
                    title="Refresh meeting data"
                    className="h-8 w-8 p-0"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                {/* Debug info */}
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded mb-4">
                    <p>Debug: User: {user.email} | Total meetings: {user.meetings?.length || 0} | Future: {futureMeetings.length}</p>
                </div>

                <div className="space-y-3">
                    {futureMeetings.length > 0 ? futureMeetings.map(meeting => (
                        <Card key={meeting.id} className="bg-background/50 relative group border-l-4 border-l-primary">
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete meeting"
                                    >
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
                                            <Button 
                                                variant="destructive" 
                                                onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                                            >
                                                Delete
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-lg pr-8 truncate">{meeting.title}</h4>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                            <Calendar className="h-4 w-4 shrink-0" />
                                            <span>{format(meeting.date, "EEE, MMM d 'at' h:mm a")}</span>
                                        </div>
                                        
                                        {meeting.participants && meeting.participants.length > 0 && (
                                            <div className="flex items-center gap-2 mt-3">
                                                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {getParticipantDetails(meeting.participants).slice(0, 5).map(p => p && (
                                                        <Avatar key={p.id} className="inline-block h-6 w-6 border-2 border-card">
                                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${p.email}`} />
                                                            <AvatarFallback className="text-xs">{getInitials(p.name)}</AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                    {meeting.participants.length > 5 && (
                                                        <div className="inline-block h-6 w-6 border-2 border-card rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                                            +{meeting.participants.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {meeting.notes && (
                                            <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                                                <div className="flex items-start gap-2">
                                                    <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                                                    <p className="line-clamp-2">{meeting.notes}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h4 className="text-lg font-medium mb-2">No upcoming meetings</h4>
                                <p className="text-muted-foreground mb-4">
                                    Schedule your first meeting using the AI assistant or calendar.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Try saying: "Schedule a meeting with John tomorrow at 2 PM"
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </CardContent>
            
            <UserContextInspector />
        </Card>
    );
}
