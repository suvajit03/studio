'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { UserData, Contact, Meeting } from '@/lib/types';
import _ from 'lodash';

interface UserContextType {
  user: UserData;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  signup: (name: string, email: string, password?: string) => boolean;
  updateUser: (data: Partial<Omit<UserData, 'meetings' | 'contacts' | 'password'>>) => void;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (contactId: string) => void;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'date'> & { date: string }) => void;
  deleteMeeting: (meetingId: string) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  refreshData: () => void; // Force refresh function
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const GUEST_USER: UserData = {
  isLoggedIn: false,
  name: 'Guest',
  email: '',
  password: '',
  avatar: '',
  location: '',
  workTime: { start: '09:00', end: '17:00' },
  offDays: [0, 6],
  contacts: [],
  meetings: [],
};

const ALL_USERS_KEY = 'meetai_all_users_data';
const CURRENT_USER_EMAIL_KEY = 'meetai_current_user_email';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData>(GUEST_USER);
  const [isLoaded, setIsLoaded] = useState(false);
  const [allUsers, setAllUsers] = useState<Record<string, UserData>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force refresh function
  const refreshData = useCallback(() => {
    console.log('🔄 Force refreshing user data');
    setForceUpdate(prev => prev + 1);
  }, []);

  // Load all users from local storage on initial load
  useEffect(() => {
    console.log('📱 Loading user data from localStorage');
    try {
        const storedAllUsers = localStorage.getItem(ALL_USERS_KEY);
        const allUsersData = storedAllUsers ? JSON.parse(storedAllUsers) : {};
        
        // Deserialize dates
        for (const email in allUsersData) {
            if (allUsersData[email].meetings) {
                allUsersData[email].meetings = allUsersData[email].meetings.map((m: any) => ({
                    ...m, 
                    date: new Date(m.date)
                }));
            }
        }
        
        console.log('📊 Loaded users data:', Object.keys(allUsersData));
        setAllUsers(allUsersData);

        const storedUserEmail = localStorage.getItem(CURRENT_USER_EMAIL_KEY);
        if (storedUserEmail && allUsersData[storedUserEmail]) {
            console.log('👤 Restoring user session for:', storedUserEmail);
            console.log('👤 User contacts:', allUsersData[storedUserEmail].contacts?.length || 0);
            console.log('👤 User meetings:', allUsersData[storedUserEmail].meetings?.length || 0);
            setUser(allUsersData[storedUserEmail]);
        } else {
            console.log('🔒 No active user session');
            setUser(GUEST_USER);
        }
    } catch(e) {
        console.error("❌ Failed to parse user data from local storage", e);
        setAllUsers({});
        setUser(GUEST_USER)
    } finally {
        setIsLoaded(true);
    }
  }, [forceUpdate]);

  // Save all users to local storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
        console.log('💾 Save effect triggered, allUsers keys:', Object.keys(allUsers).length);
        console.log('💾 User logged in:', user.isLoggedIn);
        console.log('💾 Current allUsers:', allUsers);
        
        if (Object.keys(allUsers).length > 0) {
            console.log('💾 Saving user data to localStorage');
            try {
                // Create a deep copy for serialization to avoid modifying the state directly
                const serializableUsers = _.cloneDeep(allUsers);
                for (const email in serializableUsers) {
                    if (serializableUsers[email].meetings) {
                        serializableUsers[email].meetings = serializableUsers[email].meetings.map((m: any) => ({
                            ...m, 
                            date: m.date.toISOString()
                        }));
                    }
                }
                localStorage.setItem(ALL_USERS_KEY, JSON.stringify(serializableUsers));
                console.log('✅ User data saved successfully to localStorage');
                console.log('✅ Saved data:', serializableUsers);

                if (user.isLoggedIn) {
                    localStorage.setItem(CURRENT_USER_EMAIL_KEY, user.email);
                    console.log('✅ Current user email saved:', user.email);
                } else {
                    localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
                    console.log('✅ Current user email removed');
                }
            } catch(e) {
                console.error("❌ Failed to save user data to local storage", e);
            }
        } else {
            console.log('💾 No users to save (allUsers is empty)');
        }
    } else {
        console.log('💾 Not loaded yet, skipping save');
    }
  }, [allUsers, user, isLoaded]);

  const login = useCallback((email: string, password?: string): boolean => {
    console.log('🔑 Attempting login for:', email);
    if (allUsers[email] && allUsers[email].password === password) {
      const userData = allUsers[email];
      console.log('✅ Login successful for:', email);
      console.log('👤 User contacts:', userData.contacts?.length || 0);
      console.log('👤 User meetings:', userData.meetings?.length || 0);
      setUser(userData);
      return true;
    }
    console.log('❌ Login failed for:', email);
    return false;
  }, [allUsers]);

  const signup = useCallback((name: string, email: string, password?: string): boolean => {
    console.log('📝 Attempting signup for:', email);
    if (allUsers[email]) {
      console.log('❌ User already exists:', email);
      return false; // User already exists
    }
    const newUser: UserData = {
      isLoggedIn: true,
      name,
      email,
      password: password || '',
      avatar: '',
      location: 'New York, USA', // Default location
      workTime: { start: '09:00', end: '17:00' },
      offDays: [0, 6],
      contacts: [],
      meetings: [],
    };
    console.log('✅ Creating new user:', email);
    setAllUsers(prev => ({ ...prev, [email]: newUser }));
    setUser(newUser);
    setShowOnboarding(true); // Trigger onboarding for new users
    return true;
  }, [allUsers]);

  const logout = useCallback(() => {
    console.log('🚪 Logging out user');
    setUser(GUEST_USER);
    localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
  }, []);

  const updateUser = useCallback((data: Partial<Omit<UserData, 'meetings' | 'contacts' | 'password'>>) => {
    if (!user.isLoggedIn) {
      console.log('❌ Cannot update user - not logged in');
      return;
    }
    console.log('📝 Updating user data:', data);
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
  }, [user]);
  
  const addContact = useCallback((contactData: Omit<Contact, 'id'>) => {
    if (!user.isLoggedIn) {
      console.log('❌ Cannot add contact - user not logged in');
      return;
    }
    
    console.log('➕ Adding contact:', contactData);
    console.log('👤 Current user contacts before:', user.contacts?.length || 0);
    
    const newContact = {
      ...contactData, 
      id: crypto.randomUUID(),
      // Ensure all required fields are present
      name: contactData.name || 'Unknown',
      email: contactData.email || '',
      number: contactData.number || '',
      description: contactData.description || ''
    };
    
    console.log('🆕 New contact created:', newContact);
    
    const updatedContacts = [...(user.contacts || []), newContact];
    const updatedUser = { ...user, contacts: updatedContacts };
    
    console.log('👤 Updated user contacts after:', updatedContacts.length);
    
    // Update both user state and allUsers
    console.log('🔄 Setting user state...');
    setUser(updatedUser);
    console.log('🔄 Setting allUsers state...');
    setAllUsers(prev => {
      const newAllUsers = { ...prev, [user.email]: updatedUser };
      console.log('🔄 Updated allUsers:', newAllUsers);
      return newAllUsers;
    });
    
    console.log('✅ Contact added successfully');
    
    // Force a refresh to ensure UI updates
    setTimeout(() => {
      console.log('🔄 Triggering force refresh after contact add');
      setForceUpdate(prev => prev + 1);
    }, 100);
  }, [user]);

  const updateContact = useCallback((updatedContact: Contact) => {
    if (!user.isLoggedIn) {
      console.log('❌ Cannot update contact - user not logged in');
      return;
    }
    console.log('📝 Updating contact:', updatedContact);
    const updatedUser = { 
      ...user, 
      contacts: user.contacts.map(c => c.id === updatedContact.id ? updatedContact : c) 
    };
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
  }, [user]);

  const deleteContact = useCallback((contactId: string) => {
    if (!user.isLoggedIn) {
      console.log('❌ Cannot delete contact - user not logged in');
      return;
    }
    console.log('🗑️ Deleting contact:', contactId);
    const updatedUser = { 
      ...user, 
      contacts: user.contacts.filter(c => c.id !== contactId) 
    };
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
  }, [user]);

  const addMeeting = useCallback((meetingData: Omit<Meeting, 'id'|'date'> & { date: string }) => {
    if (!user.isLoggedIn) {
      console.log('❌ Cannot add meeting - user not logged in');
      return;
    }
    
    console.log('➕ Adding meeting:', meetingData);
    console.log('📅 Current user meetings before:', user.meetings?.length || 0);
    
    const newMeeting: Meeting = { 
      ...meetingData, 
      id: crypto.randomUUID(), 
      date: new Date(meetingData.date),
      // Ensure all required fields are present
      title: meetingData.title || 'Untitled Meeting',
      participants: meetingData.participants || [],
      notes: meetingData.notes || ''
    };
    
    console.log('🆕 New meeting created:', newMeeting);
    
    const updatedMeetings = [...(user.meetings || []), newMeeting].sort((a,b) => a.date.getTime() - b.date.getTime());
    const updatedUser = { ...user, meetings: updatedMeetings };
    
    console.log('📅 Updated user meetings after:', updatedMeetings.length);
    
    // Update both user state and allUsers
    console.log('🔄 Setting user state...');
    setUser(updatedUser);
    console.log('🔄 Setting allUsers state...');
    setAllUsers(prev => {
      const newAllUsers = { ...prev, [user.email]: updatedUser };
      console.log('🔄 Updated allUsers:', newAllUsers);
      return newAllUsers;
    });
    
    console.log('✅ Meeting added successfully');
    
    // Force a refresh to ensure UI updates
    setTimeout(() => {
      console.log('🔄 Triggering force refresh after meeting add');
      setForceUpdate(prev => prev + 1);
    }, 100);
  }, [user]);

  const deleteMeeting = useCallback((meetingId: string) => {
    if (!user.isLoggedIn) {
      console.log('❌ Cannot delete meeting - user not logged in');
      return;
    }
    console.log('🗑️ Deleting meeting:', meetingId);
    const updatedUser = { 
      ...user, 
      meetings: user.meetings.filter(m => m.id !== meetingId) 
    };
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
  }, [user]);

  const contextValue = useMemo(
    () => ({ 
      user, 
      login, 
      logout, 
      signup, 
      updateUser, 
      addContact, 
      updateContact, 
      deleteContact, 
      addMeeting, 
      deleteMeeting, 
      showOnboarding, 
      setShowOnboarding,
      refreshData 
    }),
    [user, login, logout, signup, updateUser, addContact, updateContact, deleteContact, addMeeting, deleteMeeting, showOnboarding, refreshData]
  );

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
