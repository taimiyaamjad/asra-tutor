'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/ai-tutor-chat.ts';
import '@/ai/flows/generate-quiz.ts';
import '@/ai/flows/generate-article.ts';
import '@/ai/flows/generate-mock-paper.ts';
import '@/ai/flows/generate-notes.ts';
