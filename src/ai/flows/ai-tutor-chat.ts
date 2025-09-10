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

const CrossSubjectLinkSchema = z.object({
    subject: z.string().describe('The related academic subject (e.g., "Mathematics", "Chemistry").'),
    concept: z.string().describe('The specific concept in the related subject (e.g., "Vectors", "Chemical Bonds").'),
    explanation: z.string().describe('A brief explanation of how the primary topic and the related concept are linked.'),
});

const AiTutorChatOutputSchema = z.object({
  answer: z.string().describe('The detailed, context-aware answer to the student\'s question.'),
  crossSubjectLinks: z.array(CrossSubjectLinkSchema).optional().describe('A list of connections to other academic subjects, if any are found.'),
});
export type AiTutorChatOutput = z.infer<typeof AiTutorChatOutputSchema>;

export async function aiTutorChat(input: AiTutorChatInput): Promise<AiTutorChatOutput> {
  return aiTutorChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiTutorChatPrompt',
  input: {schema: AiTutorChatInputSchema},
  output: {schema: AiTutorChatOutputSchema},
  prompt: `You are an expert AI Tutor. Your goal is to provide a clear and detailed answer to the student's question.

In addition to answering the question, you MUST analyze the topic and identify if it has strong connections to other academic subjects (like Physics, Math, Chemistry, History, etc.).

If you find any relevant connections, populate the 'crossSubjectLinks' array. For each link, specify the subject, the related concept, and a concise explanation of the link. If no strong connections are found, leave the array empty.

  Conversation Context:
  {{{context}}}

  Student's Question:
  "{{{question}}}"

  Your Answer:`,
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
