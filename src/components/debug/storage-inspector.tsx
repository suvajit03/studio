'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2, Eye } from 'lucide-react';
import { useUser } from '@/components/providers/user-provider';

export default function StorageInspector() {
    const [storageData, setStorageData] = useState<Record<string, any>>({});
    const [parsedData, setParsedData] = useState<any>(null);
    const { user, refreshData } = useUser();

    const refreshStorage = () => {
        const data: Record<string, any> = {};
        
        // Get all localStorage keys that relate to our app
        const keys = ['meetai_all_users_data', 'meetai_current_user_email'];
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    data[key] = JSON.parse(value);
                } catch (e) {
                    data[key] = value; // Keep as string if not JSON
                }
            }
        });
        
        setStorageData(data);
        
        // Parse the all users data for current user
        if (data.meetai_all_users_data && data.meetai_current_user_email) {
            const allUsers = data.meetai_all_users_data;
            const currentEmail = data.meetai_current_user_email;
            setParsedData({
                currentUser: currentEmail,
                userData: allUsers[currentEmail] || null,
                totalUsers: Object.keys(allUsers).length
            });
        }
    };

    useEffect(() => {
        refreshStorage();
    }, [user]);

    const clearStorage = () => {
        localStorage.removeItem('meetai_all_users_data');
        localStorage.removeItem('meetai_current_user_email');
        refreshStorage();
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>🔍 Storage Inspector (Debug)</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={refreshStorage}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refresh
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => refreshData()}>
                            <Eye className="h-4 w-4 mr-1" />
                            Force UI Refresh
                        </Button>
                        <Button size="sm" variant="destructive" onClick={clearStorage}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear Storage
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Context User */}
                <div className="p-3 bg-blue-50 rounded">
                    <h4 className="font-semibold text-blue-900">Current Context User:</h4>
                    <div className="text-sm text-blue-800 mt-1">
                        <p><strong>Logged In:</strong> {user.isLoggedIn ? 'Yes' : 'No'}</p>
                        <p><strong>Email:</strong> {user.email || 'None'}</p>
                        <p><strong>Contacts Count:</strong> {user.contacts?.length || 0}</p>
                        <p><strong>Meetings Count:</strong> {user.meetings?.length || 0}</p>
                    </div>
                </div>

                {/* Storage Data */}
                <div className="p-3 bg-green-50 rounded">
                    <h4 className="font-semibold text-green-900">LocalStorage Data:</h4>
                    <div className="text-sm text-green-800 mt-1">
                        <p><strong>Current User Email:</strong> {storageData.meetai_current_user_email || 'None'}</p>
                        <p><strong>Total Users in Storage:</strong> {parsedData?.totalUsers || 0}</p>
                    </div>
                </div>

                {/* Parsed User Data */}
                {parsedData?.userData && (
                    <div className="p-3 bg-purple-50 rounded">
                        <h4 className="font-semibold text-purple-900">Stored User Data:</h4>
                        <div className="text-sm text-purple-800 mt-1">
                            <p><strong>Name:</strong> {parsedData.userData.name}</p>
                            <p><strong>Email:</strong> {parsedData.userData.email}</p>
                            <p><strong>Stored Contacts:</strong> {parsedData.userData.contacts?.length || 0}</p>
                            <p><strong>Stored Meetings:</strong> {parsedData.userData.meetings?.length || 0}</p>
                        </div>
                        
                        {/* Show actual contacts */}
                        {parsedData.userData.contacts && parsedData.userData.contacts.length > 0 && (
                            <div className="mt-2">
                                <p className="font-medium">Contacts in Storage:</p>
                                <ul className="text-xs space-y-1 mt-1">
                                    {parsedData.userData.contacts.map((contact: any, i: number) => (
                                        <li key={i} className="bg-white p-1 rounded">
                                            {contact.name} ({contact.email}) - ID: {contact.id}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {/* Show actual meetings */}
                        {parsedData.userData.meetings && parsedData.userData.meetings.length > 0 && (
                            <div className="mt-2">
                                <p className="font-medium">Meetings in Storage:</p>
                                <ul className="text-xs space-y-1 mt-1">
                                    {parsedData.userData.meetings.map((meeting: any, i: number) => (
                                        <li key={i} className="bg-white p-1 rounded">
                                            {meeting.title} - {meeting.date} - ID: {meeting.id}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Raw Storage Dump */}
                <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Raw Storage Data (Click to expand)</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                        {JSON.stringify(storageData, null, 2)}
                    </pre>
                </details>
            </CardContent>
        </Card>
    );
}