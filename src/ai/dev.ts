'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/ai-tutor-chat.ts';
import '@/ai/flows/generate-quiz.ts';
import '@/ai/flows/generate-article.ts';
import '@/ai/flows/generate-mock-paper.ts';
import '@/ai/flows/generate-notes.ts';
import '@/ai/flows/predict-rank.ts';
import '@/ai/flows/generate-flashcards.ts';
import '@/ai/flows/generate-connections.ts';
import '@/ai/flows/explain-concept-with-image.ts';
import '@/ai/flows/future-self-mentor.ts';
