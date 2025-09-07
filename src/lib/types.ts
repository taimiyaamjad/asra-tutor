
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
