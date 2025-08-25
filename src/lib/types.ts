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
