
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  number: z.string().optional(),
  description: z.string().optional(),
});
export type Contact = z.infer<typeof ContactSchema>;


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

export const UserSettingsSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  location: z.string().optional(),
  workTimeStart: z.string().optional(),
  workTimeEnd: z.string().optional(),
  offDays: z.array(z.number()).optional(),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;


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
  meetings: z.array(z.object({
      id: z.string(),
      title: z.string(),
      date: z.string(),
      participants: z.array(z.string()),
      notes: z.string().optional(),
  })).describe('The user\'s existing meetings.'),
  userName: z.string(),
  userLocation: z.string(),
  workTime: z.string(),
  offDays: z.string(),
  openAiMode: z.boolean().describe('Whether the user is in open-ended AI mode.'),
});
export type ScheduleMeetingInput = z.infer<typeof ScheduleMeetingInputSchema>;

export const ScheduleMeetingOutputSchema = z.object({
  response: z.string().describe('A summary of the action taken or a conversational reply.'),
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

export interface HourData {
    time: string;
    temp_c: number;
    condition: { text: string; icon: string; };
    wind_kph: number;
    pressure_mb: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    vis_km: number;
}

export interface ForecastInfo {
    time: string;
    temp: string;
    condition: string;
    icon: JSX.Element;
    hourData: HourData;
}

export interface WeatherInfo {
    temp: string;
    condition: string;
    icon: JSX.Element;
    wind: string;
    humidity: string;
    feelsLike: string;
    tempMin: string;
    tempMax: string;
    pressure: string;
    visibility: string;
    cloudiness: string;
    sunrise: string;
    sunset: string;
    forecast: ForecastInfo[];
    day: any; // WeatherAPI forecastday.day object
    current: any; // WeatherAPI current object
}

export interface WeatherMetric {
    name: string;
    key: keyof WeatherInfo['day'] | keyof WeatherInfo['current'] | 'feelslike_c' | 'pressure_mb' | 'temp_c';
    unit: string;
    icon: LucideIcon;
    precision: number;
}

interface WeatherDataBase {
    date: string; // "YYYY-MM-DD"
    value: number;
}
export interface HistoricalData extends WeatherDataBase {
    type: 'history';
}
export interface ForecastData extends WeatherDataBase {
    type: 'forecast';
}
