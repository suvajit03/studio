
'use server';

/**
 * @fileOverview AI-powered meeting scheduler and assistant flow.
 *
 * This file defines a Genkit flow that allows users to interact with the application
 * via natural language instructions provided to an AI chatbot. It can schedule meetings,
 * check weather, manage contacts, view meetings, update settings, and answer general questions.
 *
 * - scheduleMeeting - The main function for the AI assistant.
 * - ScheduleMeetingInput - Input type for the scheduleMeeting function.
 * - ScheduleMeetingOutput - Output type for the scheduleMeeting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ScheduleMeetingInputSchema, ScheduleMeetingOutputSchema, MeetingSchema, type ScheduleMeetingInput, type ScheduleMeetingOutput, ContactSchema, UserSettingsSchema } from '@/lib/types';
import { format } from 'date-fns';

export async function scheduleMeeting(input: ScheduleMeetingInput): Promise<ScheduleMeetingOutput> {
  
  const createMeeting = ai.defineTool({
      name: 'createMeeting',
      description: 'Creates a new meeting and saves it to the user\'s calendar. Use this when the user asks to schedule, book, or create a meeting.',
      inputSchema: MeetingSchema,
      outputSchema: z.object({ success: z.boolean() }),
  }, async (meeting) => {
      // This is a placeholder for a real implementation that would save to a database.
      // The component that calls this flow will handle the actual state update.
      console.log("AI is creating meeting:", meeting);
      return { success: true };
  });

  const createNewContact = ai.defineTool({
    name: 'createNewContact',
    description: "Adds a new contact to the user's contact list. Use this when the user wants to add or create a new contact.",
    inputSchema: ContactSchema.omit({ id: true }),
    outputSchema: z.object({ success: z.boolean() }),
  }, async (contact) => {
    console.log("AI is creating contact:", contact);
    return { success: true };
  });

  const updateUserSettings = ai.defineTool({
    name: 'updateUserSettings',
    description: "Updates the user's account settings, such as name, location, or work schedule. Use this when the user wants to modify, change, or update their settings.",
    inputSchema: UserSettingsSchema,
    outputSchema: z.object({ success: z.boolean() }),
  }, async (settings) => {
    console.log("AI is updating settings:", settings);
    return { success: true };
  });

  const viewMeetings = ai.defineTool({
    name: 'viewMeetings',
    description: "Displays the user's upcoming or past meetings. Use this when the user asks to see, show, or list their meetings.",
    inputSchema: z.object({
        timeframe: z.enum(['future', 'past']).describe("Specify whether to view 'future' or 'past' meetings."),
    }),
    outputSchema: z.string().describe('A formatted summary of the meetings.'),
  },
  async ({ timeframe }, flow) => {
    const allMeetings = flow.state.meetings || [];
    const now = new Date();
    const relevantMeetings = allMeetings.filter(m => {
        const meetingDate = new Date(m.date);
        return timeframe === 'future' ? meetingDate >= now : meetingDate < now;
    });

    if (relevantMeetings.length === 0) {
        return `You have no ${timeframe} meetings.`;
    }

    const meetingSummary = relevantMeetings.map(m => `- "${m.title}" on ${format(new Date(m.date), 'PPP p')}`).join('\\n');
    return `Here are your ${timeframe} meetings:\\n${meetingSummary}`;
  });

  const logoutUser = ai.defineTool({
      name: 'logoutUser',
      description: 'Logs the current user out of the application. Use this when the user asks to log out or sign out.',
      inputSchema: z.object({}),
      outputSchema: z.object({ success: z.boolean() }),
  }, async () => {
    console.log("AI is logging out user.");
    return { success: true };
  })


  const getWeather = ai.defineTool({
    name: 'getWeather',
    description: 'Retrieves the current weather conditions or a forecast for a given location. Use this when the user asks about the weather.',
    inputSchema: z.object({
      location: z.string().describe('The location to retrieve weather information for.'),
    }),
    outputSchema: z.string().describe('A summary of the current weather conditions.'),
  },
  async (input) => {
    try {
      const weatherResponse = await fetch(`https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHERAPI_KEY}&q=${input.location}`);
      if (!weatherResponse.ok) {
          return `Sorry, I couldn't get the weather for ${input.location}.`;
      }
      const weather = await weatherResponse.json();
      return `The weather in ${input.location} is ${weather.current.condition.text} with a temperature of ${weather.current.temp_c} degrees Celsius.`
    } catch(e) {
      console.error(e);
      return `Sorry, I couldn't get the weather for ${input.location}.`;
    }
  });

  const searchLocation = ai.defineTool({
    name: 'searchLocation',
    description: 'Searches for a location, like a coffee shop or restaurant. Use this to help find a venue for a meeting.',
    inputSchema: z.object({
      query: z.string().describe('The search query, e.g., "coffee shop" or "pizza".'),
      location: z.string().describe('The area to search in, e.g., "Mountain View, CA".'),
    }),
    outputSchema: z.string().describe('A list of matching locations or a message if none are found.'),
  },
  async ({ query, location }) => {
    try {
        const searchResponse = await fetch(`https://api.weatherapi.com/v1/search.json?key=${process.env.WEATHERAPI_KEY}&q=${query} in ${location}`);
        if (!searchResponse.ok) {
            return `Sorry, I couldn't search for "${query}" near ${location}.`;
        }
        const searchData = await searchResponse.json();
        if (searchData && searchData.length > 0) {
            const locations = searchData.map((l: any) => `${l.name}, ${l.region}`).join('; ');
            return `I found these locations: ${locations}. Which one would you like?`;
        }
        return `I couldn't find any locations matching "${query}" near ${location}.`;
    } catch(e) {
        console.error(e);
        return `Sorry, I couldn't search for locations.`;
    }
  });

  const scheduleMeetingPrompt = ai.definePrompt({
    name: 'scheduleMeetingPrompt',
    tools: [getWeather, createMeeting, searchLocation, viewMeetings, createNewContact, updateUserSettings, logoutUser],
    input: {schema: ScheduleMeetingInputSchema},
    output: {schema: ScheduleMeetingOutputSchema},
    prompt: `You are an AI assistant named MeetAI. Your role is to help users manage their schedules, contacts, and settings, and answer general questions.

    The user's name is: {{userName}}
    The user's location is: {{userLocation}}
    The user's working hours are: {{workTime}}
    The user's off days are: {{offDays}}
    The current date and time is: ${new Date().toISOString()}

    The following contacts are available:
    {{#if contacts}}
    {{#each contacts}}
    - ID: {{id}}, Name: {{name}} ({{email}})
    {{/each}}
    {{else}}
    No contacts available.
    {{/if}}

    The user's existing meetings are:
    {{#if meetings}}
    {{#each meetings}}
    - Title: {{title}}, Date: {{date}}
    {{/each}}
    {{else}}
    No meetings scheduled.
    {{/if}}
    
    User's Instruction: {{{instruction}}}

    Based on the user's instruction, decide which tool to use, if any.
    - For scheduling, always confirm the date and time. Meetings cannot be in the past. If participants are mentioned who are not in the contact list, inform the user.
    - If the user is in "AI" mode (openAiMode is true), you can also answer general knowledge questions conversationally. If the user is not in "AI" mode, stick to the available tools.
    - If you use a tool, provide a friendly confirmation message about the action you've taken in the 'response' field. If no tool is required, just provide a conversational response.
    `,
  });

  const {output} = await scheduleMeetingPrompt(input);
  return output!;
}
