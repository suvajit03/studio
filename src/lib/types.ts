import { z } from 'zod';

export interface Contact {
  id: string;
  name: string;
  email: string;
  number?: string;
  description?: string;
}

export const MeetingSchema = z.object({
  title: z.string().optional().describe('The title of the meeting. Defaults to "Untitled Meeting" if not provided.'),
  date: z.string().describe('The date and time of the meeting in ISO 8601 format.'),
  participants: z.array(z.string()).optional().describe('An array of participant contact IDs. Can be empty.'),
  notes: z.string().optional().describe('Optional notes for the meeting.'),
});
export type MeetingData = z.infer<typeof MeetingSchema>;


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

export const ScheduleMeetingInputSchema = z.object({
  instruction: z.string().describe('The user\'s instruction for scheduling a meeting.'),
  contacts: z.array(z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      number: z.string().optional(),
      description: z.string().optional(),
  })).describe('The user\'s contact list.'),
  userName: z.string(),
  userLocation: z.string(),
  workTime: z.string(),
  offDays: z.string(),
});
export type ScheduleMeetingInput = z.infer<typeof ScheduleMeetingInputSchema>;

export const ScheduleMeetingOutputSchema = z.object({
  meetingDetails: z.string().describe('A summary of the scheduled meeting.'),
  inviteSent: z.boolean().describe('Indicates if the meeting invite was sent.'),
});
export type ScheduleMeetingOutput = z.infer<typeof ScheduleMeetingOutputSchema>;


export const GenerateAvatarInputSchema = z.object({
  description: z.string().describe('A description of the desired avatar.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

export const GenerateAvatarOutputSchema = z.object({
  avatarDataUri: z.string().describe('The generated avatar as a data URI.'),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

export const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The synthesized audio as a WAV data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;
