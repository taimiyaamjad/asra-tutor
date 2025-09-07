
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { generateQuiz as generateQuizFlow } from "./ai"; // We'll create this file
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

// Function to handle game logic updates on topic selection
export const onTopicSubmit = functions.firestore
  .document("games/{gameId}")
  .onUpdate(async (change, context) => {
    const gameId = context.params.gameId;
    const before = change.before.data() as Game;
    const after = change.after.data() as Game;

    // We only care about the transition into the topic selection phase or updates within it.
    if (after.state !== 'topic-selection') return;
    
    // Check if both players have now submitted their topics.
    const beforeP1Submitted = before.players[0].topicSubmitted;
    const beforeP2Submitted = before.players[1].topicSubmitted;
    const afterP1Submitted = after.players[0].topicSubmitted;
    const afterP2Submitted = after.players[1].topicSubmitted;
    
    // This ensures we only run this logic once when the second player submits.
    if ((beforeP1Submitted && beforeP2Submitted) || !(afterP1Submitted && afterP2Submitted)) {
      return;
    }

    let topic1 = after.players[0].topic || randomTopics[Math.floor(Math.random() * randomTopics.length)];
    let topic2 = after.players[1].topic || randomTopics[Math.floor(Math.random() * randomTopics.length)];
    
    // If one player didn't submit, use the other's topic.
    if(!after.players[0].topic && after.players[1].topic) topic1 = topic2;
    if(after.players[0].topic && !after.players[1].topic) topic2 = topic1;


    // Update player topics in case they were random
    const updatedPlayers = [...after.players];
    updatedPlayers[0].topic = topic1;
    updatedPlayers[1].topic = topic2;

    // Generate questions for round 1 (based on player 1's topic)
    const quizData1 = await generateQuiz(topic1, 5, 'medium');
    
    await db.collection("games").doc(gameId).update({ 
        players: updatedPlayers,
        state: "round-1",
        round: 1,
        questions: quizData1,
        currentQuestionIndex: 0,
        "timestamps.round-1": admin.firestore.FieldValue.serverTimestamp(),
    });
  });


// Cloud Function to handle game timeouts
export const handleGameTimeout = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // Handle topic selection timeouts
    const topicTimeoutQuery = db.collection('games').where('state', '==', 'topic-selection');
    const topicSnaps = await topicTimeoutQuery.get();
    await Promise.all(topicSnaps.docs.map(async (doc) => {
        const game = doc.data() as Game;
        const createdAt = game.createdAt as admin.firestore.Timestamp;
        if (now.seconds - createdAt.seconds > 30) { // 30 second timeout for topic selection
            const p1Submitted = game.players[0].topicSubmitted;
            const p2Submitted = game.players[1].topicSubmitted;
            
            // If not both have submitted, force submission
            if(!(p1Submitted && p2Submitted)) {
                 await doc.ref.update({
                    'players.0.topicSubmitted': true,
                    'players.1.topicSubmitted': true,
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
                    // Timeout round 1, move to round 2
                     const quizData2 = await generateQuiz(game.players[1].topic, 5, 'medium');
                     await doc.ref.update({
                         state: 'round-2',
                         round: 2,
                         questions: quizData2,
                         currentQuestionIndex: 0,
                         'timestamps.round-2': admin.firestore.FieldValue.serverTimestamp(),
                     });
                 } else if (game.state === 'round-2') {
                    // Timeout round 2, finish game
                    await doc.ref.update({ state: 'finished', 'timestamps.finished': admin.firestore.FieldValue.serverTimestamp() });
                 }
            }
        }));
    }));

    // Cleanup finished games after 1 hour
    const finishedGamesQuery = db.collection('games').where('state', '==', 'finished');
    const finishedSnaps = await finishedGamesQuery.get();
    await Promise.all(finishedSnaps.docs.map(async (doc) => {
        const game = doc.data() as Game;
        const finishedTime = game.timestamps.finished as admin.firestore.Timestamp;
        if (finishedTime && now.seconds - finishedTime.seconds > 3600) { // 1 hour
            await doc.ref.delete();
        }
    }));


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
        
        // Initialize answers array if it doesn't exist
        if (!game.players[playerIndex].answers) {
            game.players[playerIndex].answers = {};
        }

        // Only allow answering once
        if (game.players[playerIndex].answers[questionIndex] !== undefined) {
            return { success: false, message: "Already answered." };
        }
        
        // Record the answer
        game.players[playerIndex].answers[questionIndex] = answer;
        
        // Check if both players have answered the current question
        const p1Answers = game.players[0].answers || {};
        const p2Answers = game.players[1].answers || {};
        const allAnswered = p1Answers[questionIndex] !== undefined && p2Answers[questionIndex] !== undefined;

        if (allAnswered) {
            const isLastQuestion = game.currentQuestionIndex >= 4;
            const question = game.questions[game.currentQuestionIndex];
            
            // Update scores
            if (p1Answers[game.currentQuestionIndex] === question.answer) game.players[0].score += 10;
            if (p2Answers[game.currentQuestionIndex] === question.answer) game.players[1].score += 10;
            
            if (isLastQuestion) {
                if(game.state === 'round-1') {
                    // End of round 1, start round 2
                    const topicForRound2 = game.players.find(p => p.uid === game.playerIds[1])!.topic;
                    const quizData2 = await generateQuiz(topicForRound2, 5, 'medium');
                    transaction.update(gameRef, {
                        players: game.players, // update scores
                        state: "round-2",
                        round: 2,
                        questions: quizData2,
                        currentQuestionIndex: 0,
                        "timestamps.round-2": admin.firestore.FieldValue.serverTimestamp(),
                    });
                } else { // End of round-2
                    transaction.update(gameRef, {
                        players: game.players, // update final scores
                        state: "finished",
                        "timestamps.finished": admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            } else {
                // Move to next question
                transaction.update(gameRef, {
                    players: game.players, // Update scores
                    currentQuestionIndex: admin.firestore.FieldValue.increment(1)
                });
            }
        } else {
            // Just update the player's answer without changing game state
            transaction.update(gameRef, {
                players: game.players
            });
        }
        return { success: true };
    });
});
