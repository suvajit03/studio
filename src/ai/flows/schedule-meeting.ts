
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
import { ScheduleMeetingInputSchema, ScheduleMeetingOutputSchema, MeetingSchema, type ScheduleMeetingInput, type ScheduleMeetingOutput } from '@/lib/types';


export async function scheduleMeeting(input: ScheduleMeetingInput): Promise<ScheduleMeetingOutput> {
  
  const createMeeting = ai.defineTool({
      name: 'createMeeting',
      description: 'Creates a new meeting and saves it to the user\'s calendar.',
      inputSchema: MeetingSchema,
      outputSchema: z.object({ success: z.boolean() }),
  }, async (meeting) => {
      try {
          // This is a placeholder for a real implementation that would save to a database.
          console.log("AI is creating meeting:", meeting);
          // In a real app this would be integrated with the UserProvider, but since flows
          // are server-side, we can't directly call client-side hooks.
          // This tool call is what the user-provider will listen for to update its state.
          return { success: true };
      } catch(e) {
          console.error(e)
          return { success: false }
      }
  })

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
    prompt: `You are an AI assistant that schedules meetings for users. Your name is MeetAI.

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

    Follow these steps to schedule a meeting:
    1.  **Extract Details**: Determine the meeting's title, date, time, and participants from the user's instruction. If the title is not provided, you may leave it undefined. If participants are not specified, you may also leave that field empty. A date and time are always required.
    2.  **Validate Time**: Use the user's information (work time, off days, current time) to validate the proposed meeting time. The meeting cannot be in the past or on an off day.
    3.  **Identify Participants**: If participants are requested, match them with the contact list. If a participant's name is mentioned but is not in the list, you must inform the user that you cannot schedule the meeting because the contact does not exist. Do not proceed.
    4.  **Find Location (if needed)**: If the user asks to find a location (e.g., "a coffee shop"), use the \`searchLocation\` tool.
    5.  **Check Weather (if needed)**: If the instruction involves checking the weather, use the \`getWeather\` tool. If the weather is bad (e.g., rain, snow), you can suggest rescheduling but proceed if the user insists.
    6.  **Create Meeting**: Once you have confirmed all details (a valid date/time and existing participants if any were provided), you **MUST** call the \`createMeeting\` tool to save the meeting to the calendar. Use "Untitled Meeting" if no title was provided.
    7.  **Send Invites (if needed)**: After successfully creating the meeting, if participant emails are available, use the \`sendInvite\` tool to send the invites.
    8.  **Final Summary**: Return a summary of the scheduled meeting details and confirm whether the invite was sent.

    Output should be in JSON format.
    `,
  });

  const {output} = await scheduleMeetingPrompt(input);
  return output!;
}
