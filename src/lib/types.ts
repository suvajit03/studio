import { z } from 'zod';

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
