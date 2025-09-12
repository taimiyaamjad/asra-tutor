
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Activity, Book, Target } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import type { ChatMessage } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const PenSquare = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
);
const MessageSquare = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);

const topicSuggestions: { [key: string]: string[] } = {
  default: ['Quantum Physics', 'World History', 'Differential Equations', 'Organic Chemistry'],
  calculus: ['Linear Algebra', 'Differential Equations'],
  history: ['Ancient Civilizations', 'Renaissance Art'],
  physics: ['Quantum Mechanics', 'Astrophysics'],
  chemistry: ['Organic Chemistry', 'Biochemistry'],
};

const getRecommendedTopic = (studiedTopics: string[]) => {
    if (studiedTopics.length === 0) {
        return { title: topicSuggestions.default[Math.floor(Math.random() * topicSuggestions.default.length)], description: 'New Subject' };
    }
    const lastStudied = studiedTopics[0]; // most recent topic
    const suggestions = topicSuggestions[lastStudied.toLowerCase()] || topicSuggestions.default;
    const unseenSuggestions = suggestions.filter(s => !studiedTopics.includes(s));
    
    if(unseenSuggestions.length > 0) {
        return { title: unseenSuggestions[Math.floor(Math.random() * unseenSuggestions.length)], description: 'Related to your studies' };
    }
    // If all related are seen, pick a random default one
    return { title: topicSuggestions.default[Math.floor(Math.random() * topicSuggestions.default.length)], description: 'New Subject' };
}

interface LearningProgress {
    topic: string;
    averageScore: number;
    attempts: number;
}

interface QuizAttempt {
    topic: string;
    score: number;
    createdAt: {
        toDate: () => Date;
    };
}

export default function DashboardPage() {
  const [user] = useAuthState(auth);
  const [stats, setStats] = useState([
    {
      title: 'Quizzes Completed',
      value: '0',
      icon: PenSquare,
      historyKey: 'quizzes',
    },
    {
      title: 'Questions Asked',
      value: '0',
      icon: MessageSquare,
      historyKey: 'questions',
    },
    { title: 'Average Score', value: '0%', icon: Target },
    { title: 'Active Streak', value: '0 days', icon: Activity },
  ]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [recommendedTopics, setRecommendedTopics] = useState<{title: string, description: string, icon: React.ElementType}[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [questionHistory, setQuestionHistory] = useState<ChatMessage[]>([]);


  useEffect(() => {
    if (user) {
      // Listener for quiz attempts
      const quizQuery = query(collection(db, 'users', user.uid, 'quizAttempts'), orderBy('createdAt', 'desc'));
      const unsubscribeQuizzes = onSnapshot(quizQuery, (snapshot) => {
        const quizAttempts = snapshot.docs.map(doc => doc.data()) as QuizAttempt[];
        setQuizHistory(quizAttempts);

        const totalQuizzes = quizAttempts.length;
        const averageScore = totalQuizzes > 0 
          ? quizAttempts.reduce((acc, curr) => acc + curr.score, 0) / totalQuizzes
          : 0;

        // Calculate progress per topic
        const progressByTopic: { [key: string]: { totalScore: number; count: number } } = {};
        quizAttempts.forEach(attempt => {
            if (!progressByTopic[attempt.topic]) {
                progressByTopic[attempt.topic] = { totalScore: 0, count: 0 };
            }
            progressByTopic[attempt.topic].totalScore += attempt.score;
            progressByTopic[attempt.topic].count++;
        });

        const formattedProgress = Object.entries(progressByTopic).map(([topic, data]) => ({
            topic,
            averageScore: data.totalScore / data.count,
            attempts: data.count,
        })).slice(0, 5); // Take latest 5 topics

        setLearningProgress(formattedProgress);
        
        const studiedTopics = formattedProgress.map(p => p.topic);
        const newRecs = Array.from({ length: 3 }).map(() => {
            const rec = getRecommendedTopic(studiedTopics);
            studiedTopics.push(rec.title); // Avoid duplicate recommendations in the same batch
            return { ...rec, icon: Book };
        });
        setRecommendedTopics(newRecs);


        setStats((prev) =>
          prev.map((stat) => {
            if (stat.title === 'Quizzes Completed') {
              return { ...stat, value: totalQuizzes.toString() };
            }
            if (stat.title === 'Average Score') {
              return { ...stat, value: `${averageScore.toFixed(0)}%` };
            }
            return stat;
          })
        );
      });

      // Listener for chat history
      const chatQuery = query(
        collection(db, 'users', user.uid, 'chatHistory'),
        where('role', '==', 'user'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
         const chatMessages = snapshot.docs.map(doc => doc.data()) as ChatMessage[];
         setQuestionHistory(chatMessages);
        setStats((prev) =>
          prev.map((stat) =>
            stat.title === 'Questions Asked'
              ? { ...stat, value: snapshot.size.toString() }
              : stat
          )
        );
      });
      
      // Cleanup listeners
      return () => {
        unsubscribeQuizzes();
        unsubscribeChat();
      };
    }
  }, [user]);

  const renderHistoryDialogContent = (historyKey?: string) => {
    if (historyKey === 'quizzes') {
        return (
            <ScrollArea className="h-96">
                <div className="space-y-4 pr-6">
                    {quizHistory.length > 0 ? quizHistory.map((attempt, index) => (
                        <div key={index} className="flex justify-between items-center rounded-md border p-4">
                            <div>
                                <p className="font-semibold capitalize">{attempt.topic}</p>
                                <p className="text-sm text-muted-foreground">{attempt.createdAt ? format(attempt.createdAt.toDate(), 'PPP p') : ''}</p>
                            </div>
                            <p className="font-bold text-lg text-primary">{attempt.score.toFixed(0)}%</p>
                        </div>
                    )) : <p>No quiz history yet.</p>}
                </div>
            </ScrollArea>
        );
    }
    if (historyKey === 'questions') {
        return (
            <ScrollArea className="h-96">
                <div className="space-y-4 pr-6">
                    {questionHistory.length > 0 ? questionHistory.map((msg, index) => (
                         <div key={index} className="rounded-md border p-4">
                            <p className="mb-2">{msg.content}</p>
                            <p className="text-xs text-muted-foreground text-right">{msg.createdAt ? format(msg.createdAt.toDate(), 'PPP p') : ''}</p>
                        </div>
                    )) : <p>No questions asked yet.</p>}
                </div>
            </ScrollArea>
        );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's a summary of your learning journey.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
            stat.historyKey ? (
            <Dialog key={index}>
                <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{stat.title} History</DialogTitle>
                        <DialogDescription>A log of your recent activity.</DialogDescription>
                    </DialogHeader>
                    {renderHistoryDialogContent(stat.historyKey)}
                </DialogContent>
            </Dialog>
          ) : (
            <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
            </Card>
          )
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>
              Your average scores across different subjects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {learningProgress.length > 0 ? (
                learningProgress.map((item, index) => (
                <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                    <span className="text-sm font-medium capitalize">{item.topic}</span>
                    <span className="text-sm text-muted-foreground">
                        {item.averageScore.toFixed(0)}%
                    </span>
                    </div>
                    <Progress value={item.averageScore} aria-label={`${item.topic} progress`} />
                </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>No quiz data yet.</p>
                    <p>Complete a quiz to see your progress here!</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Topics</CardTitle>
            <CardDescription>
              Suggestions to continue your learning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedTopics.map((topic, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="rounded-md bg-muted p-2">
                  <topic.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{topic.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {topic.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
