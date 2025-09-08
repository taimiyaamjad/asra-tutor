
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { generateQuiz as generateQuizFlow } from "./ai";
import { Game, Player, QuizQuestion } from '../src/lib/types';


admin.initializeApp();
const db = admin.firestore();

const randomTopics = ["History", "Science", "Math", "Literature", "Geography", "Art"];

// A wrapper to call the Genkit flow and handle its specific output
async function generateQuiz(topic: string, numQuestions: number, difficulty: string): Promise<QuizQuestion[]> {
    const result = await generateQuizFlow({ topic, numQuestions, difficulty });
    if (result && result.quiz) {
        return result.quiz;
    }
    throw new Error('Failed to generate quiz or format is incorrect.');
}

export const onTopicSubmit = functions.https.onCall(async (data, context) => {
    const { gameId, topic } = data;
    const uid = context.auth?.uid;

    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    if (!topic || typeof topic !== 'string' || topic.length > 50) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid topic provided.');
    }

    const gameRef = db.collection('games').doc(gameId);

    return db.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Game not found.');
        }

        const game = gameDoc.data() as Game;
        const playerIndex = game.players.findIndex(p => p.uid === uid);

        if (playerIndex === -1) {
            throw new functions.https.HttpsError('permission-denied', 'You are not in this game.');
        }
        if (game.state !== 'topic-selection') {
            throw new functions.https.HttpsError('failed-precondition', 'Game is not in topic selection phase.');
        }

        // Update player's topic
        game.players[playerIndex].topic = topic;
        game.players[playerIndex].topicSubmitted = true;
        
        // Check if both players have submitted
        if (game.players.every(p => p.topicSubmitted)) {
            // Both submitted, start round 1
            const topicForRound1 = game.players[0].topic || randomTopics[Math.floor(Math.random() * randomTopics.length)];
            const quizData1 = await generateQuiz(topicForRound1, 5, 'medium');

            transaction.update(gameRef, {
                players: game.players,
                state: 'round-1',
                round: 1,
                questions: quizData1,
                currentQuestionIndex: 0,
                'timestamps.round-1': admin.firestore.FieldValue.serverTimestamp(),
            });
        } else {
            // Just update this player's submission
            transaction.update(gameRef, {
                players: game.players,
            });
        }
    });
});


// Cloud Function to handle game timeouts
export const handleGameTimeout = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const batch = db.batch();
    
    // Handle topic selection timeouts
    const topicTimeoutQuery = db.collection('games').where('state', '==', 'topic-selection');
    const topicSnaps = await topicTimeoutQuery.get();
    
    await Promise.all(topicSnaps.docs.map(async (doc) => {
        const game = doc.data() as Game;
        const createdAt = game.createdAt as admin.firestore.Timestamp;
        if (now.seconds - createdAt.seconds > 30) { // 30 second timeout
            const p1Submitted = game.players[0].topicSubmitted;
            const p2Submitted = game.players[1].topicSubmitted;
            
            if(!(p1Submitted && p2Submitted)) {
                 const updatedPlayers = [...game.players];
                 let topic1 = updatedPlayers[0].topic || '';
                 let topic2 = updatedPlayers[1].topic || '';

                 if (!p1Submitted && !p2Submitted) {
                     topic1 = topic2 = randomTopics[Math.floor(Math.random() * randomTopics.length)];
                 } else if (!p1Submitted) {
                     topic1 = topic2;
                 } else { // !p2Submitted
                     topic2 = topic1;
                 }
                 updatedPlayers[0].topic = topic1;
                 updatedPlayers[1].topic = topic2;
                 
                 const quizData1 = await generateQuiz(topic1, 5, 'medium');
                 batch.update(doc.ref, {
                     players: updatedPlayers,
                     state: 'round-1',
                     round: 1,
                     questions: quizData1,
                     currentQuestionIndex: 0,
                     'timestamps.round-1': admin.firestore.FieldValue.serverTimestamp(),
                 });
            }
        }
    }));

    // Handle round timeouts
    const roundQueries = [
        db.collection('games').where('state', '==', 'round-1'),
        db.collection('games').where('state', '==', 'round-2')
    ];

    await Promise.all(roundQueries.map(async (query) => {
        const snap = await query.get();
        await Promise.all(snap.docs.map(async (doc) => {
            const game = doc.data() as Game;
            const roundStartTime = game.timestamps[game.state as 'round-1' | 'round-2'] as admin.firestore.Timestamp;
            if (roundStartTime && now.seconds - roundStartTime.seconds > 125) { // 120s + 5s buffer
                 if (game.state === 'round-1') {
                     const quizData2 = await generateQuiz(game.players[1].topic, 5, 'medium');
                     batch.update(doc.ref, {
                         state: 'round-2',
                         round: 2,
                         questions: quizData2,
                         currentQuestionIndex: 0,
                         'timestamps.round-2': admin.firestore.FieldValue.serverTimestamp(),
                     });
                 } else if (game.state === 'round-2') {
                    batch.update(doc.ref, { state: 'finished', 'timestamps.finished': admin.firestore.FieldValue.serverTimestamp() });
                 }
            }
        }));
    }));

    // Cleanup finished games after 1 hour
    const finishedGamesQuery = db.collection('games').where('state', '==', 'finished');
    const finishedSnaps = await finishedGamesQuery.get();
    finishedSnaps.docs.forEach((doc) => {
        const game = doc.data() as Game;
        const finishedTime = game.timestamps.finished as admin.firestore.Timestamp;
        if (finishedTime && now.seconds - finishedTime.seconds > 3600) { // 1 hour
            batch.delete(doc.ref);
        }
    });

    await batch.commit();
    return null;
});

// Cloud function to handle player answers
export const onPlayerAnswer = functions.https.onCall(async (data, context) => {
    const { gameId, questionIndex, answer } = data;
    const uid = context.auth?.uid;

    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const gameRef = db.collection('games').doc(gameId);
    
    return db.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if(!gameDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Game not found.');
        }

        let game = gameDoc.data() as Game;
        const playerIndex = game.players.findIndex((p: any) => p.uid === uid);
        if(playerIndex === -1) {
             throw new functions.https.HttpsError('permission-denied', 'You are not a player in this game.');
        }
        
        if (!game.players[playerIndex].answers) {
            game.players[playerIndex].answers = {};
        }

        if (game.players[playerIndex].answers[questionIndex] !== undefined) {
            return { success: false, message: "Already answered." };
        }
        
        game.players[playerIndex].answers[questionIndex] = answer;
        
        const p1Answers = game.players[0].answers || {};
        const p2Answers = game.players[1].answers || {};
        const allAnswered = p1Answers[questionIndex] !== undefined && p2Answers[questionIndex] !== undefined;

        if (allAnswered) {
            const isLastQuestion = game.currentQuestionIndex >= 4;
            const question = game.questions[game.currentQuestionIndex];
            
            if (p1Answers[game.currentQuestionIndex] === question.answer) game.players[0].score += 10;
            if (p2Answers[game.currentQuestionIndex] === question.answer) game.players[1].score += 10;
            
            if (isLastQuestion) {
                if(game.state === 'round-1') {
                    const topicForRound2 = game.players[1].topic;
                    const quizData2 = await generateQuiz(topicForRound2, 5, 'medium');
                    transaction.update(gameRef, {
                        players: game.players,
                        state: "round-2",
                        round: 2,
                        questions: quizData2,
                        currentQuestionIndex: 0,
                        "timestamps.round-2": admin.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    transaction.update(gameRef, {
                        players: game.players,
                        state: "finished",
                        "timestamps.finished": admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            } else {
                transaction.update(gameRef, {
                    players: game.players,
                    currentQuestionIndex: admin.firestore.FieldValue.increment(1)
                });
            }
        } else {
            transaction.update(gameRef, {
                players: game.players
            });
        }
        return { success: true };
    });
});


// Cloud Function to cascade delete comments when a post is deleted
export const onPostDelete = functions.firestore
    .document('posts/{postId}')
    .onDelete(async (snap, context) => {
        const { postId } = context.params;
        const commentsRef = db.collection('posts').doc(postId).collection('comments');
        const comments = await commentsRef.get();
        
        const batch = db.batch();
        comments.forEach(doc => {
            batch.delete(doc.ref);
        });

        return batch.commit();
    });
