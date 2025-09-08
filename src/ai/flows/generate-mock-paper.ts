'use server';
/**
 * @fileOverview A mock paper generator AI agent.
 *
 * - generateMockPaper - A function that handles the mock paper generation process.
 */

import {ai} from '@/ai/genkit';
import { GenerateMockPaperInputSchema, GenerateMockPaperOutputSchema, type GenerateMockPaperInput, type GenerateMockPaperOutput } from '@/lib/types';


export async function generateMockPaper(input: GenerateMockPaperInput): Promise<GenerateMockPaperOutput> {
  return generateMockPaperFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMockPaperPrompt',
  input: {schema: GenerateMockPaperInputSchema},
  output: {schema: GenerateMockPaperOutputSchema},
  prompt: `You are an expert exam paper generator for Indian competitive exams. Your task is to generate a mock paper for the specified exam type and difficulty. The paper must follow the real exam's structure, including subjects and the number of questions.

Exam Type: {{{examType}}}
Difficulty: {{{difficulty}}}

Here are the structures for the supported exams:
- **NEET**: 3 subjects: Physics, Chemistry, Biology (split into Botany and Zoology). Each subject has two sections: Section A with 35 questions (all compulsory) and Section B with 15 questions (choose any 10). Total questions to be generated: 200 (50 per subject).
- **Jee Mains**: 3 subjects: Physics, Chemistry, Mathematics. Each subject has two sections: Section A with 20 MCQs and Section B with 10 numerical value questions (choose any 5). Generate all 10 for Section B. Total questions to be generated: 90 (30 per subject).
- **Jee Advance**: Two papers. Generate only one for this task. 3 subjects: Physics, Chemistry, Mathematics. The question types and number of questions vary greatly each year. For this mock test, create 3 sections per subject: Section 1 (4 MCQs with one correct answer), Section 2 (3 MCQs with one or more correct answers), Section 3 (2 numerical answer questions). Total questions to be generated: 27 (9 per subject).
- **B. Ed**: This varies by university. Generate a general paper with 4 sections: General Knowledge (25 questions), Verbal Aptitude (25 questions), Teaching Aptitude (25 questions), and Logical Reasoning (25 questions). Total questions: 100.

For all multiple-choice questions (MCQs), provide 4 options.
For numerical questions, the 'options' array should be empty, and the 'answer' should be the numerical value as a string.

CRITICAL: Every single question object MUST have an 'answer' field. Do not forget to include the 'answer' for every question.

Your output MUST be a valid JSON object that adheres to the provided schema. Do not include any other text, formatting, or code fences. Ensure the response is a single, complete JSON object.
`,
});

const generateMockPaperFlow = ai.defineFlow(
  {
    name: 'generateMockPaperFlow',
    inputSchema: GenerateMockPaperInputSchema,
    outputSchema: GenerateMockPaperOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !Array.isArray(output.sections) || output.sections.length === 0) {
      throw new Error('Received invalid or empty paper data from AI.');
    }
    return output;
  }
);
