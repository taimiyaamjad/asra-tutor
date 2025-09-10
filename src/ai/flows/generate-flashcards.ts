'use server';
/**
 * @fileOverview A flashcard generator AI agent.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  notes: z.string().describe('The notes to be converted into flashcards.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
  front: z.string().describe('The front of the flashcard (a question or a term).'),
  back: z.string().describe('The back of the flashcard (the answer or definition).'),
});

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z-infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert at creating concise and effective study materials. Your task is to convert the following notes into a set of flashcards. Each flashcard should have a clear 'front' (a question, term, or concept) and a corresponding 'back' (the answer or definition).

Focus on the most important information and create flashcards that are easy to understand and suitable for revision.

Notes:
{{{notes}}}

Your output MUST be a valid JSON object that adheres to the provided schema. Do not include any other text, formatting, or code fences.
`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !Array.isArray(output.flashcards) || output.flashcards.length === 0) {
      throw new Error('Received invalid or empty flashcard data from AI.');
    }
    return output;
  }
);
