'use server';
/**
 * @fileOverview A note generation AI agent.
 *
 * - generateNotes - A function that handles the note generation process.
 * - GenerateNotesInput - The input type for the generateNotes function.
 * - GenerateNotesOutput - The return type for the generateNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNotesInputSchema = z.object({
  topic: z.string().describe('The topic for the notes.'),
  noteType: z.enum(['Key Points', 'Simple', 'Deep Notes']).describe('The type of notes to generate.'),
});
export type GenerateNotesInput = z.infer<typeof GenerateNotesInputSchema>;

const GenerateNotesOutputSchema = z.object({
  notes: z.string().describe('The generated notes in Markdown format.'),
});
export type GenerateNotesOutput = z.infer<typeof GenerateNotesOutputSchema>;

export async function generateNotes(input: GenerateNotesInput): Promise<GenerateNotesOutput> {
  return generateNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNotesPrompt',
  input: {schema: GenerateNotesInputSchema},
  output: {schema: GenerateNotesOutputSchema},
  prompt: `You are an expert note-taking assistant. Generate notes on the given topic based on the specified note type.
The output should be in Markdown format, well-structured with headings, subheadings, bullet points, and bold text where appropriate.

Topic: {{{topic}}}
Note Type: {{{noteType}}}

- If Note Type is "Key Points", provide a concise summary of the most important facts and concepts.
- If Note Type is "Simple", explain the topic in easy-to-understand terms, avoiding jargon.
- If Note Type is "Deep Notes", provide a comprehensive and detailed explanation of the topic, including nuances and advanced concepts.
`,
});

const generateNotesFlow = ai.defineFlow(
  {
    name: 'generateNotesFlow',
    inputSchema: GenerateNotesInputSchema,
    outputSchema: GenerateNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
