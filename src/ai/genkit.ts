import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1beta'})],
  model: 'googleai/gemini-1.5-flash-latest',
});
