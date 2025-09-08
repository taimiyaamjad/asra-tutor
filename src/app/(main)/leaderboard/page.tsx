
'use client';

import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Trophy, Star } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  user: AppUser;
  scholarScore: number;
}

const calculateScholarScore = async (userId: string): Promise<number> => {
  let score = 0;

  // Quizzes: +10 per quiz, + avg score
  const quizQuery = query(collection(db, 'users', userId, 'quizAttempts'));
  const quizSnaps = await getDocs(quizQuery);
  const numQuizzes = quizSnaps.size;
  if (numQuizzes > 0) {
    score += numQuizzes * 10;
    const totalScore = quizSnaps.docs.reduce((acc, doc) => acc + (doc.data().score || 0), 0);
    score += Math.round(totalScore / numQuizzes);
  }

  // Questions Asked: +5 per post
  const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
  const postsSnaps = await getDocs(postsQuery);
  score += postsSnaps.size * 5;
  
  // Comments Written: +2 per comment
  const commentsQuery = query(collection(db, 'comments'), where('authorId', '==', userId));
  const commentsSnaps = await getDocs(commentsQuery);
  score += commentsSnaps.size * 2;

  // AI Chat: +1 per question
  const chatQuery = query(collection(db, 'users', userId, 'chatHistory'), where('role', '==', 'user'));
  const chatSnaps = await getDocs(chatQuery);
  score += chatSnaps.size * 1;
  
  return score;
};


export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      try {
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const usersSnapshot = await getDocs(usersQuery);
        const users: AppUser[] = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));

        const leaderboardData = await Promise.all(
          users.map(async user => {
            const scholarScore = await calculateScholarScore(user.uid);
            return { user, scholarScore };
          })
        );
        
        const sortedLeaderboard = leaderboardData
          .sort((a, b) => b.scholarScore - a.scholarScore)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        setLeaderboard(sortedLeaderboard);
      } catch (error) {
        console.error("Error fetching leaderboard data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart /> Leaderboard</CardTitle>
        <CardDescription>
          See how you rank among your peers. Keep learning to climb to the top!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Scholar Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              leaderboard.map(({ rank, user, scholarScore }) => (
                <TableRow key={user.uid}>
                  <TableCell>
                     <div className="flex items-center justify-center font-bold text-lg">
                        {rank === 1 && <Trophy className="h-6 w-6 text-yellow-500" />}
                        {rank === 2 && <Trophy className="h-6 w-6 text-gray-400" />}
                        {rank === 3 && <Trophy className="h-6 w-6 text-yellow-700" />}
                        {rank > 3 && rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.photoURL || undefined} alt={user.firstName}/>
                            <AvatarFallback>{(user.firstName || user.email || 'S').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 font-bold">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{scholarScore}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && leaderboard.length === 0 && (
            <p className="text-center text-muted-foreground py-8">The leaderboard is currently empty. Start learning to get on the board!</p>
        )}
      </CardContent>
    </Card>
  );
}
