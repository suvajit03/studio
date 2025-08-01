export interface Contact {
  id: string;
  name: string;
  email: string;
  number?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: Date;
  participants: string[]; // array of contact ids
  notes?: string;
}

export interface User {
  isLoggedIn: boolean;
  name: string;
  email: string;
  avatar: string;
  location: string;
  workTime: { start: string; end: string };
  offDays: number[]; // 0 for Sunday, 1 for Monday, etc.
}

export interface UserData extends User {
  contacts: Contact[];
  meetings: Meeting[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}
