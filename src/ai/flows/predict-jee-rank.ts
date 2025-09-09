
'use server';
/**
 * @fileOverview A JEE rank and college predictor AI agent.
 *
 * - predictJeeRank - A function that handles the prediction process.
 * - PredictJeeRankInput - The input type for the predictJeeRank function.
 * - JeePrediction - The return type for the predictJeeRank function.
 */

import {ai} from '@/ai/genkit';
import { PredictJeeRankInputSchema, JeePredictionSchema, type PredictJeeRankInput, type JeePrediction } from '@/lib/types';


export async function predictJeeRank(input: PredictJeeRankInput): Promise<JeePrediction> {
  return predictJeeRankFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictJeeRankPrompt',
  input: {schema: PredictJeeRankInputSchema},
  output: {schema: JeePredictionSchema},
  prompt: `You are an expert career counselor for Indian engineering entrance exams. Your task is to predict a student's JEE percentile, All India Rank (AIR), and suggest suitable colleges based on their mock test score.

You must use your knowledge of past year's JEE data, cutoff trends, and the relationship between marks, percentile, and rank. Your predictions should be realistic and helpful.

Exam Type: {{{examType}}}
Student's Marks: {{{marks}}}

Based on this information, provide the following:
1.  **Predicted Percentile**: A realistic percentile the student can expect to achieve.
2.  **Predicted Rank**: A probable All India Rank range (e.g., "5000 - 6000").
3.  **College Suggestions**: A list of 5-7 colleges (IITs, NITs, IIITs) that are a good fit for the predicted rank. For each college, also suggest a suitable engineering branch (e.g., "Computer Science", "Mechanical Engineering").

Your output MUST be a valid JSON object that adheres to the provided schema. Do not include any other text, formatting, or code fences.
`,
});

const predictJeeRankFlow = ai.defineFlow(
  {
    name: 'predictJeeRankFlow',
    inputSchema: PredictJeeRankInputSchema,
    outputSchema: JeePredictionSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.collegeSuggestions || output.collegeSuggestions.length === 0) {
      throw new Error('Received invalid or empty prediction data from AI.');
    }
    return output;
  }
);
