'use server';

/**
 * @fileOverview AI-powered meeting scheduler flow.
 *
 * This file defines a Genkit flow that allows users to schedule meetings
 * via natural language instructions provided to an AI chatbot.
 *
 * - scheduleMeeting - The main function to schedule meetings.
 * - ScheduleMeetingInput - Input type for the scheduleMeeting function.
 * - ScheduleMeetingOutput - Output type for the scheduleMeeting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { addMeeting } from '@/lib/firebase-service';
import { ScheduleMeetingInputSchema, ScheduleMeetingOutputSchema, MeetingSchema, type ScheduleMeetingInput, type ScheduleMeetingOutput } from '@/lib/types';


export async function scheduleMeeting(input: ScheduleMeetingInput): Promise<ScheduleMeetingOutput> {
  return scheduleMeetingFlow(input);
}

const getWeather = ai.defineTool({
  name: 'getWeather',
  description: 'Retrieves the current weather conditions for a given location.',
  inputSchema: z.object({
    location: z.string().describe('The location to retrieve weather information for.'),
  }),
  outputSchema: z.string().describe('A summary of the current weather conditions.'),
},
async (input) => {
  try {
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${input.location}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);
    if (!weatherResponse.ok) {
        return `Sorry, I couldn't get the weather for ${input.location}.`;
    }
    const weather = await weatherResponse.json();
    return `The weather in ${input.location} is ${weather.weather[0].description} with a temperature of ${weather.main.temp} degrees Celsius.`
  } catch(e) {
    console.error(e);
    return `Sorry, I couldn't get the weather for ${input.location}.`;
  }
}
);

const searchLocation = ai.defineTool({
  name: 'searchLocation',
  description: 'Searches for a location, like a coffee shop or restaurant.',
  inputSchema: z.object({
    query: z.string().describe('The search query, e.g., "coffee shop" or "pizza".'),
    location: z.string().describe('The area to search in, e.g., "Mountain View, CA".'),
  }),
  outputSchema: z.string().describe('A list of matching locations or a message if none are found.'),
},
async ({ query, location }) => {
  // In a real app, you would use a proper location API (e.g., Google Maps Places API)
  // For this demo, we'll return a mock result.
  console.log(`Searching for ${query} near ${location}`);
  const mockLocations = [
    { name: "The Daily Grind", address: "123 Main St" },
    { name: "Java Junction", address: "456 Oak Ave" },
    { name: "Espresso Yourself", address: "789 Pine Ln" },
  ];
  if (query.toLowerCase().includes('coffee')) {
    return `I found these coffee shops: ${mockLocations.map(l => `${l.name} at ${l.address}`).join(', ')}. Which one would you like?`;
  }
  return `I couldn't find any locations matching "${query}" near ${location}.`;
});

const createMeeting = ai.defineTool({
    name: 'createMeeting',
    description: 'Creates a new meeting and saves it to the user\'s calendar.',
    inputSchema: MeetingSchema,
    outputSchema: z.object({ success: z.boolean() }),
}, async (meeting) => {
    try {
        await addMeeting({
            ...meeting,
            date: new Date(meeting.date)
        })
        return { success: true };
    } catch(e) {
        console.error(e)
        return { success: false }
    }
})


const sendInvite = ai.defineTool({
  name: 'sendInvite',
  description: 'Sends a meeting invite to the specified email addresses.',
  inputSchema: z.object({
    recipientEmails: z.array(z.string().email()).describe('List of recipient email addresses.'),
    meetingDetails: z.string().describe('Details of the meeting to be included in the invite.'),
  }),
  outputSchema: z.boolean().describe('Indicates if the meeting invite was successfully sent.'),
},
async (input) => {
  console.log(`Sending invite to ${input.recipientEmails.join(', ')} with details: ${input.meetingDetails}`);
  return true;
}
);

const scheduleMeetingPrompt = ai.definePrompt({
  name: 'scheduleMeetingPrompt',
  tools: [getWeather, sendInvite, createMeeting, searchLocation],
  input: {schema: ScheduleMeetingInputSchema},
  output: {schema: ScheduleMeetingOutputSchema},
  prompt: `You are an AI assistant that schedules meetings for users.  Your name is MeetAI.

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

  Instructions: {{{instruction}}}

  First, determine the details of the meeting such as title, date, time, and participants from the user's instruction.
  Use the user's information (work time, off days, current time) to validate the meeting time. It cannot be in the past.
  Identify participants from the provided contact list. If a participant is not in the list, you cannot schedule the meeting and should inform the user.
  
  If the user asks to find a location for the meeting (e.g., a coffee shop), use the \`searchLocation\` tool.
  
  Once you have all the details, use the \`createMeeting\` tool to save the meeting to the calendar.
  
  If the instruction involves checking the weather, use the \`getWeather\` tool for the user's location. If the weather is bad (e.g., rain, snow), you can suggest rescheduling but still proceed with scheduling if the user insists.
  
  After successfully creating the meeting, if participant emails are available, use the \`sendInvite\` tool to send out the invites.
  
  Finally, return a summary of the scheduled meeting details and indicate if the invite was sent.

  Output should be in JSON format.
  `,
});

const scheduleMeetingFlow = ai.defineFlow(
  {
    name: 'scheduleMeetingFlow',
    inputSchema: ScheduleMeetingInputSchema,
    outputSchema: ScheduleMeetingOutputSchema,
  },
  async input => {
    const {output} = await scheduleMeetingPrompt(input);
    return output!;
  }
);
