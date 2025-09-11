
'use server';
/**
 * @fileOverview An exam rank and college predictor AI agent.
 *
 * - predictRank - A function that handles the prediction process.
 * - PredictRankInput - The input type for the predictRank function.
 * - Prediction - The return type for the predictRank function.
 */

import {ai} from '@/ai/genkit';
import { PredictRankInputSchema, PredictionSchema, type PredictRankInput, type Prediction } from '@/lib/types';


export async function predictRank(input: PredictRankInput): Promise<Prediction> {
  return predictRankFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictRankPrompt',
  input: {schema: PredictRankInputSchema},
  output: {schema: PredictionSchema},
  prompt: `You are an expert career counselor for Indian competitive entrance exams. Your task is to predict a student's rank and suggest suitable colleges based on their mock test score.

You MUST use your knowledge of the most recent (last 1-2 years) exam data, cutoff trends, and the specific marks-vs-rank distribution for the given exam. Your predictions must be realistic and grounded in recent, real-world data.

Exam Type: {{{examType}}}
Student's Marks: {{{marks}}}

Based on this information, provide the following:
1.  **Predicted Percentile or Score**: For JEE exams, provide a percentile. For NEET, provide a predicted score.
2.  **Predicted Rank**: A probable All India Rank range (e.g., "5000 - 6000").
3.  **Prediction Rationale**: A brief (1-2 sentences) explanation for your prediction. Mention the data or trend you are basing your prediction on (e.g., "Based on last year's trends, a score in this range typically corresponds to...").
4.  **College Suggestions**: A list of 5-7 colleges (e.g., IITs, NITs, IIITs for JEE; AIIMS, JIPMER, etc. for NEET) that are a realistic fit for the predicted rank. For each college, also suggest a suitable branch (e.g., "Computer Science", "MBBS").

Your output MUST be a valid JSON object that adheres to the provided schema. Do not include any other text, formatting, or code fences.
`,
});

const predictRankFlow = ai.defineFlow(
  {
    name: 'predictRankFlow',
    inputSchema: PredictRankInputSchema,
    outputSchema: PredictionSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.collegeSuggestions || output.collegeSuggestions.length === 0) {
      throw new Error('Received invalid or empty prediction data from AI.');
    }
    return output;
  }
);
