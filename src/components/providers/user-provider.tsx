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

const ALL_USERS_KEY = 'allUsersData';
const CURRENT_USER_EMAIL_KEY = 'currentUserEmail';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData>(GUEST_USER);
  const [isLoaded, setIsLoaded] = useState(false);
  const [allUsers, setAllUsers] = useState<Record<string, UserData>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load all users from local storage on initial load
  useEffect(() => {
    try {
        const storedAllUsers = localStorage.getItem(ALL_USERS_KEY);
        const allUsersData = storedAllUsers ? JSON.parse(storedAllUsers) : {};
        
        // Deserialize dates
        for (const email in allUsersData) {
            allUsersData[email].meetings = allUsersData[email].meetings.map((m: any) => ({...m, date: new Date(m.date)}));
        }
        setAllUsers(allUsersData);

        const storedUserEmail = localStorage.getItem(CURRENT_USER_EMAIL_KEY);
        if (storedUserEmail && allUsersData[storedUserEmail]) {
            setUser(allUsersData[storedUserEmail]);
        } else {
            setUser(GUEST_USER);
        }
    } catch(e) {
        console.error("Failed to parse user data from local storage", e);
        setAllUsers({});
        setUser(GUEST_USER)
    } finally {
        setIsLoaded(true);
    }
  }, []);

  // Save all users to local storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
        try {
            // Create a deep copy for serialization to avoid modifying the state directly
            const serializableUsers = _.cloneDeep(allUsers);
             for (const email in serializableUsers) {
                serializableUsers[email].meetings = serializableUsers[email].meetings.map((m: any) => ({...m, date: m.date.toISOString()}));
            }
            localStorage.setItem(ALL_USERS_KEY, JSON.stringify(serializableUsers));

            if (user.isLoggedIn) {
                localStorage.setItem(CURRENT_USER_EMAIL_KEY, user.email);
            } else {
                localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
            }
        } catch(e) {
            console.error("Failed to save user data to local storage", e);
        }
    }
  }, [allUsers, user, isLoaded]);

  const login = useCallback((email: string, password?: string): boolean => {
    if (allUsers[email] && allUsers[email].password === password) {
      setUser(allUsers[email]);
      return true;
    }
    return false;
  }, [allUsers]);

  const signup = useCallback((name: string, email: string, password?: string): boolean => {
    if (allUsers[email]) {
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
    setAllUsers(prev => ({ ...prev, [email]: newUser }));
    setUser(newUser);
    setShowOnboarding(true); // Trigger onboarding for new users
    return true;
  }, [allUsers]);

  const logout = useCallback(() => {
    setUser(GUEST_USER);
    localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
  }, []);

  const updateUser = useCallback((data: Partial<Omit<UserData, 'meetings' | 'contacts' | 'password'>>) => {
    if (!user.isLoggedIn) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
  }, [user]);
  
  const addContact = useCallback((contactData: Omit<Contact, 'id'>) => {
    console.log('addContact called with:', contactData);
    console.log('user.isLoggedIn:', user.isLoggedIn);
    console.log('current user.contacts:', user.contacts);
    if (!user.isLoggedIn) {
      console.log('User not logged in, returning early');
      return;
    }
    const newContact = {...contactData, id: crypto.randomUUID()};
    console.log('New contact created:', newContact);
    const updatedUser = { ...user, contacts: [...user.contacts, newContact] };
    console.log('Updated user contacts:', updatedUser.contacts);
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
    console.log('Contact added successfully');
  }, [user]);

  const updateContact = useCallback((updatedContact: Contact) => {
    if (!user.isLoggedIn) return;
    const updatedUser = { ...user, contacts: user.contacts.map(c => c.id === updatedContact.id ? updatedContact : c) };
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
  }, [user]);

  const deleteContact = useCallback((contactId: string) => {
    if (!user.isLoggedIn) return;
    const updatedUser = { ...user, contacts: user.contacts.filter(c => c.id !== contactId) };
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
  }, [user]);

  const addMeeting = useCallback((meetingData: Omit<Meeting, 'id'|'date'> & { date: string }) => {
    console.log('addMeeting called with:', meetingData);
    console.log('user.isLoggedIn:', user.isLoggedIn);
    console.log('current user.meetings:', user.meetings);
    if (!user.isLoggedIn) {
      console.log('User not logged in, returning early');
      return;
    }
    const newMeeting: Meeting = { ...meetingData, id: crypto.randomUUID(), date: new Date(meetingData.date) };
    console.log('New meeting created:', newMeeting);
    const updatedMeetings = [...user.meetings, newMeeting].sort((a,b) => a.date.getTime() - b.date.getTime());
    const updatedUser = { ...user, meetings: updatedMeetings };
    console.log('Updated user meetings:', updatedUser.meetings);
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
    console.log('Meeting added successfully');
  }, [user]);

  const deleteMeeting = useCallback((meetingId: string) => {
    if (!user.isLoggedIn) return;
    const updatedUser = { ...user, meetings: user.meetings.filter(m => m.id !== meetingId) };
    setUser(updatedUser);
    setAllUsers(prev => ({ ...prev, [user.email]: updatedUser }));
  }, [user]);

  const contextValue = useMemo(
    () => ({ user, login, logout, signup, updateUser, addContact, updateContact, deleteContact, addMeeting, deleteMeeting, showOnboarding, setShowOnboarding }),
    [user, login, logout, signup, updateUser, addContact, updateContact, deleteContact, addMeeting, deleteMeeting, showOnboarding]
  );

  if (!isLoaded) {
    return null; // Or a loading spinner
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
