
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateQuiz } from '@/ai/flows/generate-quiz';
import type { Quiz, UserQuizAttempt, QuizResult } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';


export default function QuizPage() {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserQuizAttempt>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const { toast } = useToast();
  const [user] = useAuthState(auth);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      toast({
        title: 'Topic required',
        description: 'Please enter a topic for the quiz.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setQuiz(null);
    setResult(null);
    setUserAnswers({});
    try {
      const response = await generateQuiz({
        topic,
        numQuestions: parseInt(numQuestions),
      });

      let parsedResponse;
      try {
        // The AI sometimes returns a string that is not a valid JSON object.
        // It might be wrapped in ```json ... ``` or be just the array.
        const jsonString = response.quiz.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedResponse = JSON.parse(jsonString);
      } catch (parseError) {
         console.error('Failed to parse quiz JSON string:', response.quiz);
         throw new Error('Received invalid quiz format from AI.');
      }
      
      let quizData;
      // The AI might return an array directly, or the expected object.
      // We handle both cases to be safe.
      if (Array.isArray(parsedResponse)) {
        quizData = { quiz: parsedResponse };
      } else if (parsedResponse && Array.isArray(parsedResponse.quiz)) {
        quizData = parsedResponse;
      }

      if (quizData && quizData.quiz.length > 0) {
        setQuiz(quizData);
      } else {
        console.error('Parsed quiz is not in the expected format:', parsedResponse);
        throw new Error('Received invalid quiz format from AI.');
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate the quiz. Please try again or rephrase your topic.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !user) return;

    let correctAnswers = 0;
    const results = quiz.quiz.map((q, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === q.answer;
      if (isCorrect) correctAnswers++;
      return {
        question: q.question,
        userAnswer: userAnswer || 'Not answered',
        correctAnswer: q.answer,
        isCorrect,
      };
    });
    
    const score = (correctAnswers / quiz.quiz.length) * 100;

    const quizResultData = {
      score,
      correctAnswers,
      totalQuestions: quiz.quiz.length,
      topic,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'users', user.uid, 'quizAttempts'), quizResultData);
      setResult({
        ...quizResultData,
        results,
      });
    } catch (error) {
      console.error("Error saving quiz result: ", error);
      toast({
        title: 'Submission Failed',
        description: 'Could not save your quiz results. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const getOptionClass = (isCorrect: boolean, isSelected: boolean) => {
    if (!result) return '';
    if (isCorrect) return 'text-green-600 dark:text-green-500 font-bold';
    if(isSelected) return 'text-red-600 dark:text-red-500 line-through';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Generator</CardTitle>
          <CardDescription>
            Create a quiz on any topic to test your knowledge.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleGenerateQuiz}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., The Renaissance"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num-questions">Number of Questions</Label>
              <Select
                value={numQuestions}
                onValueChange={setNumQuestions}
                disabled={isLoading}
              >
                <SelectTrigger id="num-questions">
                  <SelectValue placeholder="Select number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              Generate Quiz
            </Button>
          </CardFooter>
        </form>
      </Card>

      {quiz && !result && (
        <Card>
          <CardHeader>
            <CardTitle>Quiz on: {topic}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.quiz.map((q, index) => (
              <div key={index}>
                <p className="mb-4 font-medium">
                  {index + 1}. {q.question}
                </p>
                <RadioGroup
                  onValueChange={(value) => handleAnswerChange(index, value)}
                  className="space-y-2"
                >
                  {q.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`q${index}o${optIndex}`} />
                      <Label htmlFor={`q${index}o${optIndex}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSubmitQuiz}>Submit Quiz</Button>
          </CardFooter>
        </Card>
      )}

      {result && quiz && (
         <Card>
         <CardHeader>
           <CardTitle>Quiz Results</CardTitle>
           <CardDescription className="text-2xl font-bold text-primary">
             Your score: {result.score.toFixed(2)}%
           </CardDescription>
           <p>You answered {result.correctAnswers} out of {result.totalQuestions} questions correctly.</p>
         </CardHeader>
         <CardContent className="space-y-6">
           {result.results.map((res, index) => (
             <div key={index} className="rounded-lg border p-4">
               <p className="mb-4 font-medium">{index + 1}. {res.question}</p>
               <div className="space-y-2">
                 {quiz.quiz[index].options.map((option, optIndex) => (
                    <div key={optIndex} className={cn("flex items-center gap-2", getOptionClass(option === res.correctAnswer, option === res.userAnswer))}>
                      {option === res.correctAnswer ? <CheckCircle className="h-4 w-4" /> : (option === res.userAnswer ? <XCircle className="h-4 w-4" /> : <div className="h-4 w-4" />)}
                      <span>{option}</span>
                    </div>
                 ))}
               </div>
             </div>
           ))}
         </CardContent>
         <CardFooter>
           <Button onClick={() => {
              setQuiz(null);
              setResult(null);
           }}>Try Another Quiz</Button>
         </CardFooter>
       </Card>
      )}
    </div>
  );
}
