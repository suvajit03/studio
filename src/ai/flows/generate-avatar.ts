'use server';

/**
 * @fileOverview This file contains the Genkit flow for generating a user avatar.
 *
 * - generateAvatar - A function that generates an avatar image based on a description.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import { ai } from '@/ai/genkit';
import { GenerateAvatarInputSchema, GenerateAvatarOutputSchema, type GenerateAvatarInput, type GenerateAvatarOutput } from '@/lib/types';


export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async ({ description }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a professional and friendly avatar for a user based on the following description: ${description}. The avatar should be suitable for a professional profile picture.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media.url) {
      throw new Error('Image generation failed.');
    }

    return {
      avatarDataUri: media.url,
    };
  }
);
