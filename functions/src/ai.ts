
import { configure, genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { z } from "zod";

configure({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz.'),
  numQuestions: z.number().describe('The number of questions to generate.'),
  difficulty: z.string().describe("The difficulty of the quiz. Can be 'easy', 'medium', or 'hard'.").optional(),
});

const QuizQuestionSchema = z.object({
  question: z.string().describe('The text of the quiz question.'),
  options: z.array(z.string()).describe('An array of possible answers.'),
  answer: z.string().describe('The correct answer from the options.'),
});

const GenerateQuizOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
});

export const generateQuiz = genkit.defineFlow(
  {
    name: 'generateQuiz',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ topic, numQuestions, difficulty }) => {
    const prompt = `You are a quiz generator. Generate a quiz on the topic of ${topic} with ${numQuestions} questions. The difficulty should be ${difficulty}.
    Your output MUST be a valid JSON object that adheres to the provided schema. Do not include any other text, formatting, or code fences.
    Example: { "quiz": [{ "question": "...", "options": [...], "answer": "..." }] }
    Ensure that for each question, the 'answer' field is one of the strings present in the 'options' array.
    `;

    const llmResponse = await genkit.generate({
      model: 'googleai/gemini-pro',
      prompt: prompt,
      output: {
        format: 'json',
        schema: GenerateQuizOutputSchema,
      },
    });

    const output = llmResponse.output();
    if (!output || !Array.isArray(output.quiz)) {
      throw new Error('Received invalid or empty quiz data from AI.');
    }
    return output;
  }
);
