'use client';

import { useUser } from '@/components/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function UserContextInspector() {
    const { user, refreshData } = useUser();
    const [expandedContact, setExpandedContact] = useState<string | null>(null);
    const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>👤 User Context Inspector</span>
                    <Button size="sm" variant="outline" onClick={() => refreshData()}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh Context
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* User Info */}
                    <div className="p-3 bg-slate-50 rounded">
                        <h4 className="font-semibold text-slate-900">User Info</h4>
                        <div className="text-sm text-slate-800 mt-1 space-y-1">
                            <p><strong>Logged In:</strong> {user.isLoggedIn ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>Email:</strong> {user.email || 'None'}</p>
                            <p><strong>Name:</strong> {user.name || 'None'}</p>
                        </div>
                    </div>

                    {/* Data Counts */}
                    <div className="p-3 bg-amber-50 rounded">
                        <h4 className="font-semibold text-amber-900">Data Counts</h4>
                        <div className="text-sm text-amber-800 mt-1 space-y-1">
                            <p><strong>Contacts:</strong> {user.contacts?.length || 0}</p>
                            <p><strong>Meetings:</strong> {user.meetings?.length || 0}</p>
                            <p><strong>Off Days:</strong> {user.offDays?.length || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Contacts Detail */}
                <div className="p-3 bg-green-50 rounded">
                    <h4 className="font-semibold text-green-900">
                        Contacts in Context ({user.contacts?.length || 0})
                    </h4>
                    {user.contacts && user.contacts.length > 0 ? (
                        <div className="text-sm text-green-800 mt-1 space-y-2">
                            {user.contacts.map((contact, i) => (
                                <div key={contact.id} className="bg-white p-2 rounded border">
                                    <div className="flex justify-between items-center">
                                        <span>
                                            <strong>{contact.name}</strong> ({contact.email})
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setExpandedContact(
                                                expandedContact === contact.id ? null : contact.id
                                            )}
                                        >
                                            {expandedContact === contact.id ? '−' : '+'}
                                        </Button>
                                    </div>
                                    {expandedContact === contact.id && (
                                        <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                                            <p><strong>ID:</strong> {contact.id}</p>
                                            <p><strong>Phone:</strong> {contact.number || 'None'}</p>
                                            <p><strong>Description:</strong> {contact.description || 'None'}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-green-700 mt-1">No contacts in context</p>
                    )}
                </div>

                {/* Meetings Detail */}
                <div className="p-3 bg-blue-50 rounded">
                    <h4 className="font-semibold text-blue-900">
                        Meetings in Context ({user.meetings?.length || 0})
                    </h4>
                    {user.meetings && user.meetings.length > 0 ? (
                        <div className="text-sm text-blue-800 mt-1 space-y-2">
                            {user.meetings.map((meeting, i) => (
                                <div key={meeting.id} className="bg-white p-2 rounded border">
                                    <div className="flex justify-between items-center">
                                        <span>
                                            <strong>{meeting.title}</strong> - {meeting.date?.toString()}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setExpandedMeeting(
                                                expandedMeeting === meeting.id ? null : meeting.id
                                            )}
                                        >
                                            {expandedMeeting === meeting.id ? '−' : '+'}
                                        </Button>
                                    </div>
                                    {expandedMeeting === meeting.id && (
                                        <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                                            <p><strong>ID:</strong> {meeting.id}</p>
                                            <p><strong>Date:</strong> {meeting.date?.toString()}</p>
                                            <p><strong>Participants:</strong> {meeting.participants?.length || 0}</p>
                                            <p><strong>Notes:</strong> {meeting.notes || 'None'}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-blue-700 mt-1">No meetings in context</p>
                    )}
                </div>

                {/* Raw Context Data */}
                <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Raw User Context (Click to expand)</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs max-h-96">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </details>
            </CardContent>
        </Card>
    );
}