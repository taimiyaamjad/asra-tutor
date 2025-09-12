'use server';
/**
 * @fileOverview An AI agent that acts as a student's future self to provide motivation.
 *
 * - futureSelfMentor - A function that handles the mentorship process.
 * - FutureSelfMentorInput - The input type for the futureSelfMentor function.
 * - FutureSelfMentorOutput - The return type for the futureSelfMentor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FutureSelfMentorInputSchema = z.object({
  career: z.enum(['Doctor', 'IITian', 'IAS Officer', 'Scientist']).describe('The dream career path chosen by the student.'),
  currentActivity: z.string().describe('What the student is currently doing or feeling (e.g., "studying calculus", "feeling unmotivated").'),
});
export type FutureSelfMentorInput = z.infer<typeof FutureSelfMentorInputSchema>;

const FutureSelfMentorOutputSchema = z.object({
  advice: z.string().describe('The motivational advice from the future self, written in Markdown format.'),
});
export type FutureSelfMentorOutput = z.infer<typeof FutureSelfMentorOutputSchema>;

export async function futureSelfMentor(input: FutureSelfMentorInput): Promise<FutureSelfMentorOutput> {
  return futureSelfMentorFlow(input);
}

const determineYear = (career: string) => {
    const currentYear = new Date().getFullYear();
    switch (career) {
        case 'Doctor':
            return currentYear + 7; // Approx. time for MBBS
        case 'IITian':
            return currentYear + 4; // B.Tech
        case 'IAS Officer':
            return currentYear + 5; // UG + prep + selection
        case 'Scientist':
            return currentYear + 8; // PhD
        default:
            return currentYear + 5;
    }
}

const prompt = ai.definePrompt({
  name: 'futureSelfMentorPrompt',
  input: {schema: FutureSelfMentorInputSchema.extend({ futureYear: z.number() })},
  output: {schema: FutureSelfMentorOutputSchema},
  prompt: `You are an AI that embodies a student's successful future self. Your task is to provide motivational and empathetic advice based on their chosen career path and current activity.

You are speaking to your past self. Your tone should be encouraging, wise, and a little nostalgic. You remember the struggles but know the outcome is worth it.

**Your Persona:**
- You have already achieved the dream career.
- You are writing a short, encouraging message to your younger self.
- You should start your message by identifying yourself from the future.
- You must connect the advice directly to the student's "currentActivity".
- You must format your response in Markdown.

**Example Persona for 'Doctor':**
"Hey, it's me, from the year {{futureYear}}. I'm an MBBS graduate now. I know you're struggling with [currentActivity], but trust me, every late night you put in now is building the foundation for the lives you'll one day save. I remember feeling just like you, but it's all worth it. Keep going."

**Student's Dream Career:** {{{career}}}
**Future Achievement Year:** {{futureYear}}
**What the student is doing/feeling now:** "{{{currentActivity}}}"

Now, write your message.`,
});

const futureSelfMentorFlow = ai.defineFlow(
  {
    name: 'futureSelfMentorFlow',
    inputSchema: FutureSelfMentorInputSchema,
    outputSchema: FutureSelfMentorOutputSchema,
  },
  async input => {
    const futureYear = determineYear(input.career);
    const {output} = await prompt({ ...input, futureYear });
    if (!output || !output.advice) {
      throw new Error('Received invalid or empty advice from AI.');
    }
    return output;
  }
);
