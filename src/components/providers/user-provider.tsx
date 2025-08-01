'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';
import type { UserData, Contact, Meeting } from '@/lib/types';
import { DUMMY_USER_DATA, DUMMY_CONTACTS, DUMMY_MEETINGS } from '@/lib/dummy-data';

interface UserContextType {
  user: UserData;
  login: (email: string) => void;
  logout: () => void;
  updateUser: (data: Partial<UserData>) => void;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (contactId: string) => void;
  addMeeting: (meeting: Meeting) => void;
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

  const login = (email: string) => {
    setUser({ ...DUMMY_USER_DATA, email, isLoggedIn: true, contacts: DUMMY_CONTACTS, meetings: DUMMY_MEETINGS });
  };

  const logout = () => {
    setUser(GUEST_USER);
  };

  const updateUser = (data: Partial<UserData>) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  const addContact = (contactData: Omit<Contact, 'id'>) => {
    const newContact: Contact = { ...contactData, id: crypto.randomUUID() };
    setUser(prev => ({ ...prev, contacts: [...prev.contacts, newContact] }));
  };

  const updateContact = (updatedContact: Contact) => {
    setUser(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => c.id === updatedContact.id ? updatedContact : c),
    }));
  };

  const deleteContact = (contactId: string) => {
    setUser(prev => ({...prev, contacts: prev.contacts.filter(c => c.id !== contactId)}));
  }

  const addMeeting = (meeting: Meeting) => {
    setUser((prev) => ({ ...prev, meetings: [...prev.meetings, meeting].sort((a,b) => a.date.getTime() - b.date.getTime()) }));
  };

  const contextValue = useMemo(
    () => ({ user, login, logout, updateUser, addContact, updateContact, deleteContact, addMeeting }),
    [user]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
