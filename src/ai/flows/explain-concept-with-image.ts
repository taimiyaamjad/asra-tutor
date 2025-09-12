'use server';
/**
 * @fileOverview An AI agent that explains a concept using a real-world object from an image.
 *
 * - explainConceptWithImage - A function that handles the explanation process.
 * - ExplainConceptWithImageInput - The input type for the explainConceptWithImage function.
 * - ExplainConceptWithImageOutput - The return type for the explainConceptWithImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainConceptWithImageInputSchema = z.object({
  concept: z.string().describe('The academic or scientific concept the user wants to understand.'),
  photoDataUri: z.string().describe(
      "A photo of a real-world object, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExplainConceptWithImageInput = z.infer<typeof ExplainConceptWithImageInputSchema>;

const ExplainConceptWithImageOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the concept, using the object in the image as a practical example. The explanation should be in Markdown format.'),
});
export type ExplainConceptWithImageOutput = z.infer<typeof ExplainConceptWithImageOutputSchema>;

export async function explainConceptWithImage(input: ExplainConceptWithImageInput): Promise<ExplainConceptWithImageOutput> {
  return explainConceptWithImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainConceptWithImagePrompt',
  input: {schema: ExplainConceptWithImageInputSchema},
  output: {schema: ExplainConceptWithImageOutputSchema},
  prompt: `You are an expert teacher with a talent for making complex topics easy to understand using real-world examples.

Your task is to explain the provided academic concept using the object in the user's photo as a practical, real-life example.

1.  First, identify the primary object in the photo.
2.  Then, formulate a clear and simple explanation of the academic concept.
3.  Finally, connect your explanation directly to the object in the photo, describing how the concept applies to it.
4.  Format your entire response in Markdown.

Academic Concept:
"{{{concept}}}"

Photo of object:
{{media url=photoDataUri}}
`,
});

const explainConceptWithImageFlow = ai.defineFlow(
  {
    name: 'explainConceptWithImageFlow',
    inputSchema: ExplainConceptWithImageInputSchema,
    outputSchema: ExplainConceptWithImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.explanation) {
      throw new Error('Received invalid or empty explanation from AI.');
    }
    return output;
  }
);
