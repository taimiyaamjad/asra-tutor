
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateMockPaper } from '@/ai/flows/generate-mock-paper';
import type { MockPaper, MockPaperQuestion } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClipboardPen, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';


const examCategories = [
    {
        category: "Engineering",
        exams: ["JEE Main", "JEE Advanced", "BITSAT", "VITEEE", "SRMJEEE", "COMEDK UGET", "WBJEE", "MHT CET"]
    },
    {
        category: "Medical",
        exams: ["NEET UG", "NEET PG", "AIIMS PG", "FMGE", "INI CET"]
    },
    {
        category: "Management (MBA)",
        exams: ["CAT", "XAT", "CMAT", "MAT", "NMAT", "SNAP", "IIFT"]
    },
    {
        category: "Science & Research",
        exams: ["JAM (IIT JAM)", "GATE", "ICAR ARS NET"]
    },
    {
        category: "Civil Services & Government Jobs",
        exams: ["UPSC Civil Services Examination (CSE)", "UPSC Combined Defence Services (CDS)", "UPSC Engineering Services Examination (ESE)", "UPSC NDA", "UPSC CAPF", "SSC CGL", "SSC CHSL", "SSC MTS", "IBPS PO", "IBPS Clerk", "SBI PO", "RBI Grade B", "LIC AAO"]
    },
    {
        category: "Law",
        exams: ["CLAT", "AILET", "LSAT India"]
    },
    {
        category: "Universities & Common Entrance Tests",
        exams: ["CUET", "IPU CET", "TISS NET"]
    },
    {
        category: "Design & Architecture",
        exams: ["NID DAT", "NIFT", "NATA", "CEED"]
    },
    {
        category: "Defence",
        exams: ["NDA", "CDS", "AFCAT"]
    },
    {
        category: "Entrance",
        exams: ["AMU 9th Entrance", "AMU 11th Entrance", "BHU 9th Entrance", "BHU 11th Entrance", "Jamia 9th Entrance", "Jamia 11th Entrance"]
    },
    {
        category: "Teaching",
        exams: ["CTET", "UGC NET", "CSIR UGC NET", "KVS Exam", "NVS Exam", "DSSSB Exam", "REET", "TNTET", "MPTET", "HTET", "APTET", "WBTET", "MAHA TET", "KTET", "GPSTR"]
    },
    {
        category: "Other",
        exams: ["B. Ed"]
    }
];

interface UserAnswers {
  [sectionIndex: number]: {
    [questionIndex: number]: string;
  };
}

interface PaperResult {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    attemptedQuestions: number;
    results: {
        sectionName: string;
        question: string;
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
    }[];
}

export default function AccessionPage() {
  const [examType, setExamType] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [mockPaper, setMockPaper] = useState<MockPaper | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [result, setResult] = useState<PaperResult | null>(null);
  const { toast } = useToast();

  const handleGeneratePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examType) {
      toast({
        title: 'Exam Type required',
        description: 'Please select an exam type.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setMockPaper(null);
    setResult(null);
    setUserAnswers({});
    try {
      const response = await generateMockPaper({
        examType,
        difficulty,
      });

      if (response && response.sections && response.sections.length > 0) {
        setMockPaper(response);
      } else {
        throw new Error('Received invalid or empty paper format from AI.');
      }
    } catch (error) {
      console.error('Failed to generate mock paper:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate the paper. Please try again or adjust your settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (sectionIndex: number, questionIndex: number, value: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [sectionIndex]: {
        ...prev[sectionIndex],
        [questionIndex]: value,
      },
    }));
  };

  const handleSubmitPaper = () => {
    if (!mockPaper) return;

    let correctCount = 0;
    let attemptedCount = 0;
    let totalQuestions = 0;
    const detailedResults: PaperResult['results'] = [];

    mockPaper.sections.forEach((section, sIndex) => {
        section.questions.forEach((q, qIndex) => {
            totalQuestions++;
            const userAnswer = userAnswers[sIndex]?.[qIndex];
            if (userAnswer) {
                attemptedCount++;
                const isCorrect = userAnswer === q.answer;
                if (isCorrect) correctCount++;
                detailedResults.push({
                    sectionName: section.sectionName,
                    question: q.question,
                    userAnswer,
                    correctAnswer: q.answer,
                    isCorrect,
                });
            }
        });
    });

    setResult({
        score: totalQuestions > 0 && attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0,
        correctAnswers: correctCount,
        totalQuestions,
        attemptedQuestions: attemptedCount,
        results: detailedResults,
    });
  };

  const renderPaperContent = () => {
    if (isLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-6 w-1/4 mb-4" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        )
    }

    if (result && mockPaper) {
        return (
            <Card>
                 <CardHeader>
                    <CardTitle>Results for: {mockPaper.title}</CardTitle>
                    <CardDescription className="text-2xl font-bold text-primary">
                        Your score: {result.score.toFixed(2)}%
                    </CardDescription>
                    <p>You answered {result.correctAnswers} out of {result.attemptedQuestions} attempted questions correctly. ({result.totalQuestions} total questions)</p>
                 </CardHeader>
                 <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {mockPaper.sections.map((section, sIndex) => (
                             <AccordionItem value={`section-${sIndex}`} key={sIndex}>
                                <AccordionTrigger>{section.sectionName}</AccordionTrigger>
                                <AccordionContent className="space-y-6">
                                     {section.questions.map((q, qIndex) => {
                                        const userAnswer = userAnswers[sIndex]?.[qIndex];
                                        const isCorrect = userAnswer === q.answer;
                                        return (
                                             <div key={qIndex} className="rounded-lg border p-4">
                                                <p className="mb-2 font-medium">{qIndex + 1}. {q.question}</p>
                                                <div className="space-y-2 text-sm">
                                                    {q.options.length > 0 ? q.options.map((option, oIndex) => (
                                                        <div key={oIndex} className={cn("flex items-center gap-2", 
                                                            option === q.answer ? 'text-green-600 dark:text-green-500 font-bold' : (option === userAnswer ? 'text-red-600 dark:text-red-500 line-through' : 'text-muted-foreground')
                                                        )}>
                                                          {option === q.answer ? <CheckCircle className="h-4 w-4" /> : (option === userAnswer ? <XCircle className="h-4 w-4" /> : <div className="h-4 w-4" />)}
                                                          <span>{option}</span>
                                                        </div>
                                                    )) : (
                                                        <div className="flex flex-col gap-1">
                                                           <p className={cn(isCorrect ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500')}>Your answer: {userAnswer || 'Not Answered'}</p>
                                                           <p>Correct answer: {q.answer}</p>
                                                        </div>
                                                    )}
                                                </div>
                                             </div>
                                        )
                                     })}
                                </AccordionContent>
                             </AccordionItem>
                        ))}
                    </Accordion>
                 </CardContent>
                 <CardFooter>
                    <Button onClick={() => {
                        setMockPaper(null);
                        setResult(null);
                    }}>Try Another Paper</Button>
                 </CardFooter>
            </Card>
        )
    }

    if(mockPaper) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>{mockPaper.title}</CardTitle>
                    <CardDescription>
                        Complete the paper and submit to see your results.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Accordion type="single" collapsible className="w-full" defaultValue="section-0">
                        {mockPaper.sections.map((section, sIndex) => (
                             <AccordionItem value={`section-${sIndex}`} key={sIndex}>
                                <AccordionTrigger>{section.sectionName}</AccordionTrigger>
                                <AccordionContent className="space-y-6">
                                     {section.questions.map((q, qIndex) => (
                                         <div key={qIndex}>
                                            <p className="mb-4 font-medium">{qIndex + 1}. {q.question}</p>
                                            <RadioGroup onValueChange={(value) => handleAnswerChange(sIndex, qIndex, value)} className="space-y-2">
                                                {q.options.map((option, optIndex) => (
                                                     <div key={optIndex} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`s${sIndex}q${qIndex}o${optIndex}`} />
                                                        <Label htmlFor={`s${sIndex}q${qIndex}o${optIndex}`}>{option}</Label>
                                                     </div>
                                                ))}
                                            </RadioGroup>
                                         </div>
                                     ))}
                                </AccordionContent>
                             </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSubmitPaper}>Finish Test</Button>
                </CardFooter>
             </Card>
        )
    }

    return null;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardPen /> Accession</CardTitle>
          <CardDescription>
            Generate a mock paper for a competitive exam to test your skills under pressure.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleGeneratePaper}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exam-type">Exam Type</Label>
              <Select onValueChange={setExamType} disabled={isLoading}>
                <SelectTrigger id="exam-type">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {examCategories.map((category) => (
                    <SelectGroup key={category.category}>
                        <SelectLabel>{category.category}</SelectLabel>
                        {category.exams.map((type) => (
                            <SelectItem key={`${category.category}-${type}`} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={setDifficulty}
                disabled={isLoading}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !examType}>
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
              Generate Paper
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {renderPaperContent()}

    </div>
  );
}
