import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: "AIzaSyDIc2Zot63gZgn_-9XE9Fab4MF-FH5J0OY"})],
  model: 'googleai/gemini-2.0-flash',
});
