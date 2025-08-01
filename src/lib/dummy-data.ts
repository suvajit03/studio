import type { User, Contact, Meeting } from '@/lib/types';

export const DUMMY_USER_DATA: Omit<User, 'isLoggedIn' | 'email'> = {
  name: 'Alex Doe',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  location: 'London, UK',
  workTime: { start: '09:00', end: '17:30' },
  offDays: [6, 0], // Saturday, Sunday
};

export const DUMMY_CONTACTS: Contact[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', number: '123-456-7890' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', number: '234-567-8901' },
  { id: '3', name: 'Sam Wilson', email: 'sam.wilson@example.com' },
];

export const DUMMY_MEETINGS: Meeting[] = [
    {
        id: 'm1',
        title: 'Quarterly Report Review',
        date: new Date(new Date().setDate(new Date().getDate() + 2)),
        participants: ['1', '2'],
        notes: 'Discuss Q3 performance and plan for Q4.'
    },
    {
        id: 'm2',
        title: 'Project Phoenix Kick-off',
        date: new Date(new Date().setDate(new Date().getDate() + 5)),
        participants: ['2', '3'],
        notes: 'Initial brainstorming and role assignment.'
    },
    {
        id: 'm3',
        title: 'Client Catch-up',
        date: new Date(new Date().setDate(new Date().getDate() + 10)),
        participants: ['1'],
        notes: 'Follow up on the latest proposal.'
    }
].sort((a,b) => a.date.getTime() - b.date.getTime());
