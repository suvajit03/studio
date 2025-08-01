// This is a placeholder for firebase services.
// In a real application, this would be wired up to a real Firebase project.

import type { Meeting, Contact, UserData } from './types';
import { DUMMY_MEETINGS, DUMMY_CONTACTS } from './dummy-data';

let meetings: Meeting[] = [...DUMMY_MEETINGS];
let contacts: Contact[] = [...DUMMY_CONTACTS];
let userData: Partial<Omit<UserData, 'meetings' | 'contacts'>> = {};

let meetingsListeners: ((meetings: Meeting[]) => void)[] = [];
let contactsListeners: ((contacts: Contact[]) => void)[] = [];

function notifyMeetingsListeners() {
    meetingsListeners.forEach(listener => listener(meetings));
}

function notifyContactsListeners() {
    contactsListeners.forEach(listener => listener(contacts));
}


export function onMeetingsUpdate(callback: (meetings: Meeting[]) => void): () => void {
    meetingsListeners.push(callback);
    callback(meetings); // initial call

    return () => {
        meetingsListeners = meetingsListeners.filter(l => l !== callback);
    }
}

export function onContactsUpdate(callback: (contacts: Contact[]) => void): () => void {
    contactsListeners.push(callback);
    callback(contacts); // initial call

    return () => {
        contactsListeners = contactsListeners.filter(l => l !== callback);
    }
}

export async function addMeeting(meeting: Omit<Meeting, 'id'>) {
    const newMeeting = { ...meeting, id: crypto.randomUUID() };
    meetings.push(newMeeting);
    meetings.sort((a,b) => a.date.getTime() - b.date.getTime());
    notifyMeetingsListeners();
    return newMeeting;
}

export async function deleteMeeting(meetingId: string) {
    meetings = meetings.filter(m => m.id !== meetingId);
    notifyMeetingsListeners();
}

export async function addContact(contact: Omit<Contact, 'id'>) {
    const newContact = { ...contact, id: crypto.randomUUID() };
    contacts = [...contacts, newContact];
    notifyContactsListeners();
    return newContact;
}

export async function updateContact(contact: Contact) {
    contacts = contacts.map(c => c.id === contact.id ? contact : c);
    notifyContactsListeners();
}

export async function deleteContact(contactId: string) {
    contacts = contacts.filter(c => c.id !== contactId);
    notifyContactsListeners();
}

export async function updateUser(data: Partial<Omit<UserData, 'meetings' | 'contacts'>>) {
    userData = {...userData, ...data};
}
