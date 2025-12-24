import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: "AIzaSyB3oOPlUwqEKdkCvnWgow_QLu5yg-hOBYM"})],
  model: 'googleai/gemini-2.5-flash',
});
