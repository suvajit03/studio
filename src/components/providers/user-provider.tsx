'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { UserData, Contact, Meeting } from '@/lib/types';
import { DUMMY_USER_DATA, DUMMY_CONTACTS, DUMMY_MEETINGS } from '@/lib/dummy-data';
import { onMeetingsUpdate, onContactsUpdate, updateUser as updateFirebaseUser, addContact as addFirebaseContact, updateContact as updateFirebaseContact, deleteContact as deleteFirebaseContact } from '@/lib/firebase-service';

interface UserContextType {
  user: UserData;
  login: (email: string) => void;
  logout: () => void;
  updateUser: (data: Partial<Omit<UserData, 'meetings' | 'contacts'>>) => void;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (contactId: string) => void;
  addMeeting: (meeting: Omit<Meeting, 'id'>) => void;
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

  useEffect(() => {
    if (user.isLoggedIn) {
      const meetingsUnsubscribe = onMeetingsUpdate((meetings) => {
        setUser(prev => ({...prev, meetings: meetings.sort((a,b) => a.date.getTime() - b.date.getTime())}))
      });
      
      const contactsUnsubscribe = onContactsUpdate((contacts) => {
        setUser(prev => ({...prev, contacts }))
      });

      return () => {
        meetingsUnsubscribe();
        contactsUnsubscribe();
      }
    }
  }, [user.isLoggedIn])

  const login = (email: string) => {
    const fullUserData = { ...DUMMY_USER_DATA, email, isLoggedIn: true, contacts: DUMMY_CONTACTS, meetings: DUMMY_MEETINGS };
    setUser(fullUserData);
  };

  const logout = () => {
    setUser(GUEST_USER);
  };

  const updateUser = (data: Partial<Omit<UserData, 'meetings' | 'contacts'>>) => {
    setUser((prev) => ({ ...prev, ...data }));
    updateFirebaseUser(data);
  };

  const addContact = (contactData: Omit<Contact, 'id'>) => {
    addFirebaseContact(contactData);
  };

  const updateContact = (updatedContact: Contact) => {
    updateFirebaseContact(updatedContact);
  };

  const deleteContact = (contactId: string) => {
    deleteFirebaseContact(contactId);
  }

  const addMeeting = (meeting: Omit<Meeting, 'id'>) => {
     // This is handled by the schedule-meeting flow now.
     // Local state will be updated via firebase listener.
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
