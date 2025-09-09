
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
  createdAt?: Timestamp;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface Quiz {
  quiz: QuizQuestion[];
}

export interface UserQuizAttempt {
  [questionIndex: number]: string; // selected option
}

export interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  results: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
  createdAt?: Timestamp;
}

export interface AppUser {
    uid: string;
    email: string | null;
    firstName?: string;
    lastName?: string;
    photoURL?: string;
    role: 'admin' | 'student';
}

// Heavenly Trial Types
export interface Player {
  uid: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  topic: string;
  topicSubmitted: boolean;
  answers: { [questionIndex: number]: string };
}

export type GameState = 'topic-selection' | 'round-1' | 'round-2' | 'finished';

export interface Game {
  id?: string;
  players: [Player, Player];
  playerIds: [string, string];
  state: GameState;
  round: 1 | 2;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  timestamps: {
      [key in GameState]?: Timestamp;
  }
}

// Accession (Mock Paper) Types
export const GenerateMockPaperInputSchema = z.object({
  examType: z.string().describe('The type of exam paper to generate (e.g., "NEET", "Jee Mains").'),
  difficulty: z.string().describe("The difficulty of the paper. Can be 'easy', 'medium', or 'hard'."),
});
export type GenerateMockPaperInput = z.infer<typeof GenerateMockPaperInputSchema>;

export const MockPaperQuestionSchema = z.object({
  question: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('An array of 4 possible answers.'),
  answer: z.string().describe('The correct answer from the options.'),
});
export type MockPaperQuestion = z.infer<typeof MockPaperQuestionSchema>;

export const PaperSectionSchema = z.object({
    sectionName: z.string().describe('The name of the section (e.g., "Physics Section A", "Chemistry").'),
    questions: z.array(MockPaperQuestionSchema).describe('An array of questions for this section.')
})
export type PaperSection = z.infer<typeof PaperSectionSchema>;

export const GenerateMockPaperOutputSchema = z.object({
  title: z.string().describe('The title of the mock paper.'),
  sections: z.array(PaperSectionSchema).describe('An array of sections in the paper.'),
});
export type GenerateMockPaperOutput = z.infer<typeof GenerateMockPaperOutputSchema>;
export type MockPaper = z.infer<typeof GenerateMockPaperOutputSchema>;


// Brainstorm Types
export interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorPhotoURL?: string;
    createdAt: Timestamp;
    commentCount?: number;
}

export interface Comment {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorPhotoURL?: string;
    createdAt: Timestamp;
}

// JEE Rank Predictor Types
export const PredictJeeRankInputSchema = z.object({
  examType: z.enum(['Jee Main', 'Jee Advanced']),
  marks: z.number().int().describe('The student\'s score in the mock test.'),
});
export type PredictJeeRankInput = z.infer<typeof PredictJeeRankInputSchema>;

const CollegeSuggestionSchema = z.object({
  collegeName: z.string().describe('The name of the suggested college.'),
  collegeType: z.enum(['IIT', 'NIT', 'IIIT', 'GFTI']).describe('The type of college.'),
  branchSuggestion: z.string().describe('A suitable engineering branch for the predicted rank.'),
});

export const JeePredictionSchema = z.object({
    predictedPercentile: z.number().describe("The predicted percentile based on the student's marks."),
    predictedRank: z.string().describe('The predicted All India Rank range (e.g., "5000 - 6000").'),
    collegeSuggestions: z.array(CollegeSuggestionSchema).describe('A list of suggested colleges.'),
});
export type JeePrediction = z.infer<typeof JeePredictionSchema>;
