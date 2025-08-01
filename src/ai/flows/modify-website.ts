'use server';

/**
 * @fileOverview This file contains the Genkit flow for modifying website elements based on user descriptions.
 *
 * - modifyWebsite - A function that takes a description of desired website changes and applies them.
 * - ModifyWebsiteInput - The input type for the modifyWebsite function.
 * - ModifyWebsiteOutput - The return type for the modifyWebsite function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModifyWebsiteInputSchema = z.object({
  websiteDescription: z.string().describe('The current description of the website.'),
  desiredChanges: z.string().describe('The changes the user wants to make to the website.'),
});
export type ModifyWebsiteInput = z.infer<typeof ModifyWebsiteInputSchema>;

const ModifyWebsiteOutputSchema = z.object({
  modifiedWebsite: z.string().describe('The modified website based on user changes.'),
});
export type ModifyWebsiteOutput = z.infer<typeof ModifyWebsiteOutputSchema>;

export async function modifyWebsite(input: ModifyWebsiteInput): Promise<ModifyWebsiteOutput> {
  return modifyWebsiteFlow(input);
}

const modifyWebsitePrompt = ai.definePrompt({
  name: 'modifyWebsitePrompt',
  input: {schema: ModifyWebsiteInputSchema},
  output: {schema: ModifyWebsiteOutputSchema},
  prompt: `You are an AI website modifier. A user will provide a description of their website and desired changes.
  Your job is to take in the old website description and output a new website description based on the desired changes.

  Current Website Description: {{{websiteDescription}}}
  Desired Changes: {{{desiredChanges}}}

  Modified Website:`,
});

const modifyWebsiteFlow = ai.defineFlow(
  {
    name: 'modifyWebsiteFlow',
    inputSchema: ModifyWebsiteInputSchema,
    outputSchema: ModifyWebsiteOutputSchema,
  },
  async input => {
    const {output} = await modifyWebsitePrompt(input);
    return output!;
  }
);
