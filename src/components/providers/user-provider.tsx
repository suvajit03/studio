'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { UserData, Contact, Meeting } from '@/lib/types';
import { DUMMY_USER_DATA } from '@/lib/dummy-data';

interface UserContextType {
  user: UserData;
  login: (email: string) => void;
  logout: () => void;
  updateUser: (data: Partial<Omit<UserData, 'meetings' | 'contacts'>>) => void;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (contactId: string) => void;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'date'> & { date: string }) => void;
  deleteMeeting: (meetingId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const GUEST_USER: UserData = {
  isLoggedIn: false,
  name: 'Guest',
  email: '',
  avatar: '',
  location: 'New York, USA',
  workTime: { start: '09:00', end: '17:00' },
  offDays: [0, 6],
  contacts: [],
  meetings: [],
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData>(GUEST_USER);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            // Dates need to be converted back from strings
            parsedData.meetings = parsedData.meetings.map((m: any) => ({...m, date: new Date(m.date)}));
            setUser(parsedData);
        } else {
            setUser(GUEST_USER);
        }
    } catch(e) {
        console.error("Failed to parse user data from local storage", e);
        setUser(GUEST_USER)
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem('userData', JSON.stringify(user));
        } catch(e) {
            console.error("Failed to save user data to local storage", e);
        }
    }
  }, [user, isLoaded]);

  const login = (email: string) => {
    const fullUserData: UserData = { 
        ...DUMMY_USER_DATA, 
        email, 
        isLoggedIn: true, 
        contacts: [], 
        meetings: [] 
    };
    setUser(fullUserData);
  };

  const logout = () => {
    localStorage.removeItem('userData');
    setUser(GUEST_USER);
  };

  const updateUser = (data: Partial<Omit<UserData, 'meetings' | 'contacts'>>) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  const addContact = (contactData: Omit<Contact, 'id'>) => {
     setUser(prev => ({ ...prev, contacts: [...prev.contacts, {...contactData, id: crypto.randomUUID()}]}));
  };

  const updateContact = (updatedContact: Contact) => {
    setUser(prev => ({ ...prev, contacts: prev.contacts.map(c => c.id === updatedContact.id ? updatedContact : c)}));
  };

  const deleteContact = (contactId: string) => {
    setUser(prev => ({ ...prev, contacts: prev.contacts.filter(c => c.id !== contactId)}));
  }

  const addMeeting = (meetingData: Omit<Meeting, 'id'|'date'> & { date: string }) => {
    const newMeeting: Meeting = { ...meetingData, id: crypto.randomUUID(), date: new Date(meetingData.date) };
     setUser(prev => ({ ...prev, meetings: [...prev.meetings, newMeeting].sort((a,b) => a.date.getTime() - b.date.getTime())}));
  }

  const deleteMeeting = (meetingId: string) => {
    setUser(prev => ({ ...prev, meetings: prev.meetings.filter(m => m.id !== meetingId)}));
  }

  const contextValue = useMemo(
    () => ({ user, login, logout, updateUser, addContact, updateContact, deleteContact, addMeeting, deleteMeeting }),
    [user]
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
