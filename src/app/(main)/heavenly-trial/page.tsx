
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Swords } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  limit,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Game, Player, AppUser } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function HeavenlyTrialLobbyPage() {
  const [user] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Get AppUser data
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if(doc.exists()) {
          setAppUser({ uid: user.uid, ...doc.data() } as AppUser);
        } else {
           setAppUser({ uid: user.uid, email: user.email, role: 'student', firstName: user.displayName || 'Player' });
        }
      });
      return () => unsubscribe();
    }
  }, [user]);
  
  const player: Player | null = user && appUser ? {
    uid: user.uid,
    displayName: `${appUser.firstName} ${appUser.lastName || ''}`.trim() || appUser.email || 'Anonymous',
    photoURL: appUser.photoURL || null,
    score: 0,
    topic: '',
    topicSubmitted: false,
    answers: {},
  } : null;

  // Listen for active games and redirect if found
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'games'), where('playerIds', 'array-contains', user.uid), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const gameDoc = snapshot.docs[0];
        setCurrentGameId(gameDoc.id);
        if(router) {
            router.push(`/heavenly-trial/${gameDoc.id}`);
        }
      } else {
        setCurrentGameId(null);
      }
    });
    return () => unsubscribe();
  }, [user, router]);
  
  const handleFindMatch = async () => {
    if (!player) return;
    setIsSearching(true);
    toast({ title: 'Searching for an opponent...' });

    const matchmakingQuery = query(collection(db, 'matchmaking'), where('status', '==', 'waiting'), limit(1));
    const querySnapshot = await getDocs(matchmakingQuery);

    if (querySnapshot.empty) {
      await setDoc(doc(db, 'matchmaking', player.uid), {
        player,
        status: 'waiting',
        createdAt: serverTimestamp(),
      });
    } else {
      const opponentEntry = querySnapshot.docs[0];
      const opponentPlayer = opponentEntry.data().player as Player;

      if(opponentPlayer.uid === player.uid) return;
      
      await deleteDoc(doc(db, 'matchmaking', opponentEntry.id));
      
      const newGame: Omit<Game, 'id'> = {
        players: [player, opponentPlayer],
        playerIds: [player.uid, opponentPlayer.uid],
        state: 'topic-selection',
        round: 1,
        questions: [],
        currentQuestionIndex: 0,
        createdAt: serverTimestamp(),
        timestamps: { },
      };

      const newGameRef = doc(collection(db, 'games'));
      await setDoc(newGameRef, newGame);
      // The useEffect listener will handle the redirect
    }
  };

  const handleCancelSearch = async () => {
    if (user) {
      await deleteDoc(doc(db, 'matchmaking', user.uid));
    }
    setIsSearching(false);
    toast({ title: 'Search canceled' });
  };
  
  if (currentGameId) {
      return (
          <div className="text-center p-8">
              <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="mt-4">Found an active game, redirecting...</p>
          </div>
      )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Swords />
          Heavenly Trial
        </CardTitle>
        <CardDescription>A 1v1 quiz battle of wits.</CardDescription>
      </CardHeader>
      <CardContent>
        {isSearching ? (
             <div className="text-center">
                <p className="text-xl mb-4">Searching for an opponent...</p>
                <div className="flex justify-center items-center">
                    <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <Button onClick={handleCancelSearch} variant="secondary" className="mt-4">Cancel Search</Button>
            </div>
        ) : (
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Welcome to the Heavenly Trial!</h2>
                <p className="text-muted-foreground mb-6">Challenge another student to a duel of wits. Each player picks a topic, and you'll face off in two rounds of AI-generated questions. May the sharpest mind win!</p>
                <Button size="lg" onClick={handleFindMatch} disabled={!player}>
                    <Swords className="mr-2 h-5 w-5" />
                    Find a Match
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
