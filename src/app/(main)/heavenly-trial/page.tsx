
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Swords, User, Clock, Check, X, Trophy } from 'lucide-react';
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
  getDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import type { Game, Player, GameState, AppUser, Quiz, QuizQuestion } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const randomTopics = ["History", "Science", "Math", "Literature", "Geography", "Art"];

const functions = getFunctions(auth.app);
const onPlayerAnswer = httpsCallable(functions, 'onPlayerAnswer');


export default function HeavenlyTrialPage() {
  const [user] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [topic, setTopic] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  
  const { toast } = useToast();

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

  const opponent = game && user ? game.players.find(p => p.uid !== user.uid) : null;
  const me = game && user ? game.players.find(p => p.uid === user.uid) : null;

  // Game state listeners
  useEffect(() => {
    if (!user) return;
  
    const q = query(collection(db, 'games'), where('playerIds', 'array-contains', user.uid), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const gameData = snapshot.docs[0].data() as Game;
        gameData.id = snapshot.docs[0].id;
        setGame(gameData);
        setIsSearching(false);
      } else {
        setGame(null);
      }
    }, (error) => {
        console.error("Error listening to game state:", error);
        toast({ title: "Connection Error", description: "Could not sync game state.", variant: "destructive"});
    });
  
    return () => unsubscribe();
  }, [user, toast]);
  
  useEffect(() => {
    if (game?.state === 'round-1' || game?.state === 'round-2') {
        const roundStartTime = (game.timestamps[game.state] as any)?.seconds;
        if(!roundStartTime) return;
        
        const interval = setInterval(() => {
          const now = Date.now() / 1000;
          const newTimeLeft = Math.max(0, Math.ceil(roundStartTime + 120 - now));
          setTimeLeft(newTimeLeft);
        }, 1000);
        return () => clearInterval(interval);
    }
    if(game?.state === 'topic-selection') {
         // createdAt might be a server timestamp object initially, convert to seconds if needed
         const createdAtTime = game.createdAt ? (game.createdAt as any).seconds || Math.floor(Date.now() / 1000) : Math.floor(Date.now() / 1000);

         const interval = setInterval(() => {
            const now = Date.now() / 1000;
            const newTimeLeft = Math.max(0, Math.ceil(createdAtTime + 30 - now));
            setTimeLeft(newTimeLeft);
         }, 1000);
         return () => clearInterval(interval);
    }
  }, [game]);
  
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

      if(opponentPlayer.uid === player.uid) {
          // It's me, just waiting. Do nothing.
          return;
      }
      
      await deleteDoc(doc(db, 'matchmaking', opponentEntry.id));
      
      const newGame: Omit<Game, 'id'> = {
        players: [player, opponentPlayer],
        playerIds: [player.uid, opponentPlayer.uid],
        state: 'topic-selection',
        round: 1,
        questions: [],
        currentQuestionIndex: 0,
        createdAt: serverTimestamp(),
        timestamps: {
          'topic-selection': serverTimestamp()
        },
      };

      const newGameRef = doc(collection(db, 'games'));
      await setDoc(newGameRef, newGame);
    }
  };

  const handleCancelSearch = async () => {
    if (user) {
      await deleteDoc(doc(db, 'matchmaking', user.uid));
    }
    setIsSearching(false);
    toast({ title: 'Search canceled' });
  };
  
  const handleSubmitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !user || !topic.trim() || me?.topicSubmitted) return;
    
    toast({ title: "Topic submitted!", description: `You chose: ${topic}`});

    const playerIndex = game.players.findIndex(p => p.uid === user.uid);
    if (playerIndex !== -1) {
      const gameRef = doc(db, 'games', game.id!);
      await updateDoc(gameRef, {
        [`players.${playerIndex}.topic`]: topic,
        [`players.${playerIndex}.topicSubmitted`]: true
      });
    }
  };
  
  const handleAnswerSubmit = async (questionIndex: number, selectedOption: string) => {
    if (!game || !user || !game.id) return;
    
    setUserAnswers(prev => ({...prev, [questionIndex]: selectedOption}));
    
    try {
        await onPlayerAnswer({ gameId: game.id, questionIndex, answer: selectedOption });
    } catch(error) {
        console.error("Error submitting answer:", error);
        toast({ title: "Submission Error", description: "Could not submit your answer.", variant: "destructive"});
    }
  };

  const renderContent = () => {
    if (!user || !appUser) return <div className="text-center p-8"><svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="mt-4">Loading user data...</p></div>;

    if (isSearching) {
      return (
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
      );
    }

    if (!game) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to the Heavenly Trial!</h2>
          <p className="text-muted-foreground mb-6">Challenge another student to a duel of wits. Each player picks a topic, and you'll face off in two rounds of AI-generated questions. May the sharpest mind win!</p>
          <Button size="lg" onClick={handleFindMatch} disabled={!player}>
            <Swords className="mr-2 h-5 w-5" />
            Find a Match
          </Button>
        </div>
      );
    }

    if (game.state === 'topic-selection') {
      return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Choose Your Weapon!</h2>
            <p className="text-muted-foreground mb-4">Select a topic for your round. You have {timeLeft} seconds.</p>
            <div className="flex justify-around items-start mb-6">
                <div className="flex flex-col items-center">
                    <Avatar className="h-16 w-16 mb-2">
                        <AvatarImage src={me?.photoURL || undefined} />
                        <AvatarFallback>{me?.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{me?.displayName}</p>
                     {me?.topicSubmitted ? <p className="text-green-500">Topic: {me.topic}</p> : <p>Waiting...</p>}
                </div>
                 <p className="text-4xl font-bold pt-6">VS</p>
                <div className="flex flex-col items-center">
                   <Avatar className="h-16 w-16 mb-2">
                        <AvatarImage src={opponent?.photoURL || undefined} />
                        <AvatarFallback>{opponent?.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{opponent?.displayName}</p>
                    {opponent?.topicSubmitted ? <p className="text-green-500">Topic Submitted</p> : <p>Waiting...</p>}
                </div>
            </div>
            {!me?.topicSubmitted && (
                <form onSubmit={handleSubmitTopic} className="flex gap-2 justify-center">
                    <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. The Cold War" className="max-w-xs" />
                    <Button type="submit">Submit Topic</Button>
                </form>
            )}
        </div>
      );
    }
    
    if (game.state === 'round-1' || game.state === 'round-2') {
       const currentQuestion = game.questions[game.currentQuestionIndex];
       if(!currentQuestion) return <div className="text-center p-8"><svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="mt-4">Waiting for round to start...</p></div>;
       
       const roundTopicOwner = game.state === 'round-1' ? game.players.find(p => p.uid === game.playerIds[0]) : game.players.find(p => p.uid === game.playerIds[1]);

       return (
         <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{game.state.replace('-', ' ')}: {roundTopicOwner?.topic}</h2>
                <div className="flex items-center gap-2 font-bold text-lg">
                    <Clock className="h-6 w-6" />
                    <span>{timeLeft}s</span>
                </div>
            </div>
            <Progress value={(timeLeft / 120) * 100} className="mb-6"/>

            <div className="mb-6">
                <p className="text-lg font-semibold mb-4">({game.currentQuestionIndex + 1}/5) {currentQuestion.question}</p>
                <RadioGroup onValueChange={(val) => handleAnswerSubmit(game.currentQuestionIndex, val)} value={userAnswers[game.currentQuestionIndex] || ''} className="space-y-2">
                    {currentQuestion.options.map((option, i) => (
                        <div key={i} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`q${game.currentQuestionIndex}o${i}`} disabled={!!(me?.answers || {})[game.currentQuestionIndex]}/>
                            <Label htmlFor={`q${game.currentQuestionIndex}o${i}`}>{option}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
            {(me?.answers || {})[game.currentQuestionIndex] && <p className="text-center text-green-500 font-bold">Answer submitted! Waiting for opponent...</p>}
         </div>
       )
    }

    if (game.state === 'finished') {
        const winner = game.players.reduce((a, b) => a.score > b.score ? a : (b.score > a.score ? b : null), null as Player | null);
        
        return (
            <div className="text-center">
                <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">
                    {winner ? `${winner.displayName} is Victorious!` : "It's a Tie!"}
                </h2>

                <div className="flex justify-around items-center my-8">
                     <div className="flex flex-col items-center">
                        <Avatar className="h-20 w-20 mb-2 border-2 border-primary">
                            <AvatarImage src={game.players[0].photoURL || undefined} />
                            <AvatarFallback>{game.players[0].displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-lg">{game.players[0].displayName}</p>
                        <p className="text-2xl font-bold">{game.players[0].score} pts</p>
                    </div>
                     <p className="text-5xl font-bold">VS</p>
                    <div className="flex flex-col items-center">
                        <Avatar className="h-20 w-20 mb-2 border-2 border-primary">
                            <AvatarImage src={game.players[1].photoURL || undefined} />
                            <AvatarFallback>{game.players[1].displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-lg">{game.players[1].displayName}</p>
                        <p className="text-2xl font-bold">{game.players[1].score} pts</p>
                    </div>
                </div>

                <Button onClick={async () => {
                    if (game.id) await deleteDoc(doc(db, "games", game.id));
                    setGame(null);
                }}>Play Again</Button>
            </div>
        )
    }


    return <p>Something went wrong with the game state.</p>;
  };
  
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
        {renderContent()}
      </CardContent>
    </Card>
  );
}
