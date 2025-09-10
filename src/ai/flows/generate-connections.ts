'use server';
/**
 * @fileOverview A cross-subject connection generator AI agent.
 *
 * - generateConnections - A function that handles the connection generation process.
 * - GenerateConnectionsInput - The input type for the generateConnections function.
 * - GenerateConnectionsOutput - The return type for the generateConnections function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateConnectionsInputSchema = z.object({
  topic: z.string().describe('The topic to find connections for.'),
});
export type GenerateConnectionsInput = z.infer<typeof GenerateConnectionsInputSchema>;

const SubjectConnectionSchema = z.object({
    subject: z.string().describe('The related academic subject (e.g., "Mathematics", "Chemistry").'),
    concept: z.string().describe('The specific concept in the related subject (e.g., "Vectors", "Chemical Bonds").'),
    explanation: z.string().describe('A brief explanation of how the primary topic and the related concept are linked.'),
});

const GenerateConnectionsOutputSchema = z.object({
  connections: z.array(SubjectConnectionSchema).describe('A list of connections to other academic subjects.'),
});
export type GenerateConnectionsOutput = z.infer<typeof GenerateConnectionsOutputSchema>;

export async function generateConnections(input: GenerateConnectionsInput): Promise<GenerateConnectionsOutput> {
  return generateConnectionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConnectionsPrompt',
  input: {schema: GenerateConnectionsInputSchema},
  output: {schema: GenerateConnectionsOutputSchema},
  prompt: `You are an expert in interdisciplinary studies. Your task is to identify and explain the connections between a given topic and various other academic subjects (e.g., Physics, Math, Chemistry, History, Biology, Literature).

For the topic provided by the user, find relevant links to at least 3-5 different subjects. For each connection, you must specify:
1. The 'subject' it connects to.
2. The specific 'concept' within that subject.
3. A clear and concise 'explanation' of the link.

Topic: {{{topic}}}

Your output MUST be a valid JSON object that adheres to the provided schema. Do not include any other text, formatting, or code fences.
`,
});

const generateConnectionsFlow = ai.defineFlow(
  {
    name: 'generateConnectionsFlow',
    inputSchema: GenerateConnectionsInputSchema,
    outputSchema: GenerateConnectionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
     if (!output || !Array.isArray(output.connections) || output.connections.length === 0) {
      throw new Error('Received invalid or empty connections data from AI.');
    }
    return output;
  }
);
