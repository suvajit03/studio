// schedule-meeting.ts
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

const ContactSchema = z.object({
  name: z.string().describe('Contact name'),
  email: z.string().email().describe('Contact email address'),
  number: z.string().optional().describe('Contact phone number'),
});

const ScheduleMeetingInputSchema = z.object({
  instruction: z.string().describe(
    'Natural language instruction for scheduling the meeting.  ' +
      'Example: Schedule a meeting with John Doe tomorrow at 2pm to discuss the quarterly report.'
  ),
  contacts: z.array(ContactSchema).optional().describe('List of available contacts.'),
  userName: z.string().describe('The name of the user scheduling the meeting'),
  userLocation: z.string().describe('The location of the user'),
  workTime: z.string().describe('The working hours of the user'),
  offDays: z.string().describe('Weekly off days of the user'),
});

export type ScheduleMeetingInput = z.infer<typeof ScheduleMeetingInputSchema>;

const ScheduleMeetingOutputSchema = z.object({
  meetingDetails: z.string().describe('A summary of the scheduled meeting details.'),
  inviteSent: z.boolean().describe('Indicates if the meeting invite was successfully sent.'),
});

export type ScheduleMeetingOutput = z.infer<typeof ScheduleMeetingOutputSchema>;

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
  // TODO: Implement the weather API call here.
  // For now, return a dummy weather report.
  return `The weather in ${input.location} is sunny with a temperature of 25 degrees Celsius.`
}
);

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
  // TODO: Implement the email sending logic here.
  // For now, just return true to simulate successful sending.
  console.log(`Sending invite to ${input.recipientEmails.join(', ')} with details: ${input.meetingDetails}`);
  return true;
}
);

const scheduleMeetingPrompt = ai.definePrompt({
  name: 'scheduleMeetingPrompt',
  tools: [getWeather, sendInvite],
  input: {schema: ScheduleMeetingInputSchema},
  output: {schema: ScheduleMeetingOutputSchema},
  prompt: `You are an AI assistant that schedules meetings for users.  Your name is MeetAI.

  The user's name is: {{userName}}
  The user's location is: {{userLocation}}
  The user's working hours are: {{workTime}}
  The user's off days are: {{offDays}}

  The following contacts are available:
  {{#if contacts}}
  {{#each contacts}}
  - {{name}} ({{email}})
  {{/each}}
  {{else}}
  No contacts available.
  {{/if}}

  Instructions: {{{instruction}}}

  First, use the getWeather tool to check weather condition for the user location if it is available.
  Then schedule a meeting based on the user's instruction, taking into account the user's work time, off days, and available contacts.
  If specific contacts are mentioned use only those, otherwise create a new contact. If there is no contact information create it on your own and if email address is present, use the sendInvite tool to send out invites.
  Return a summary of the scheduled meeting details and indicate if the invite was sent.

  Consider the weather condition, and if it's bad suggest to reschedule the meeting.

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

