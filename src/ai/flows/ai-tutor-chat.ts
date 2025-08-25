'use server';

/**
 * @fileOverview An AI tutor chat flow.
 *
 * - aiTutorChat - A function that handles the AI tutoring chat process.
 * - AiTutorChatInput - The input type for the aiTutorChat function.
 * - AiTutorChatOutput - The return type for the aiTutorChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiTutorChatInputSchema = z.object({
  question: z.string().describe('The question asked by the student.'),
  context: z.string().optional().describe('The context of the question.'),
});
export type AiTutorChatInput = z.infer<typeof AiTutorChatInputSchema>;

const AiTutorChatOutputSchema = z.object({
  answer: z.string().describe('The detailed, context-aware answer from the AI Tutor.'),
});
export type AiTutorChatOutput = z.infer<typeof AiTutorChatOutputSchema>;

export async function aiTutorChat(input: AiTutorChatInput): Promise<AiTutorChatOutput> {
  return aiTutorChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiTutorChatPrompt',
  input: {schema: AiTutorChatInputSchema},
  output: {schema: AiTutorChatOutputSchema},
  prompt: `You are an AI Tutor, specialized in providing detailed, context-aware answers to students.

  Context: {{{context}}}

  Question: {{{question}}}

  Answer:`,
});

const aiTutorChatFlow = ai.defineFlow(
  {
    name: 'aiTutorChatFlow',
    inputSchema: AiTutorChatInputSchema,
    outputSchema: AiTutorChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
