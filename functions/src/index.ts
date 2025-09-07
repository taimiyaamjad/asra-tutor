
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { generateQuiz } from "./ai"; // We'll create this file

admin.initializeApp();
const db = admin.firestore();

const randomTopics = ["History", "Science", "Math", "Literature", "Geography", "Art"];

// Function to handle game logic updates on topic selection
export const onTopicSubmit = functions.firestore
  .document("games/{gameId}")
  .onUpdate(async (change, context) => {
    const gameId = context.params.gameId;
    const before = change.before.data();
    const after = change.after.data();

    // Check if we are in topic selection and both players have submitted
    if (after.state === "topic-selection") {
      const allSubmitted = after.players.every((p: any) => p.topicSubmitted);
      if (allSubmitted) {
        
        let topic1 = after.players[0].topic || randomTopics[Math.floor(Math.random() * randomTopics.length)];
        let topic2 = after.players[1].topic || randomTopics[Math.floor(Math.random() * randomTopics.length)];
        
        if(!after.players[0].topic && after.players[1].topic) topic1 = topic2;
        if(after.players[0].topic && !after.players[1].topic) topic2 = topic1;


        // Update player topics in case they were random
        const updatedPlayers = [...after.players];
        updatedPlayers[0].topic = topic1;
        updatedPlayers[1].topic = topic2;


        // Generate questions for round 1
        const quizData1 = await generateQuiz({
          topic: topic1,
          numQuestions: 5,
          difficulty: 'medium',
        });
        
        await db.collection("games").doc(gameId).update({ 
            players: updatedPlayers,
            state: "round-1",
            round: 1,
            questions: quizData1.quiz,
            currentQuestionIndex: 0,
            "timestamps.round-1": admin.firestore.Timestamp.fromMillis(Date.now() + 120 * 1000),
        });
      }
    } else if (after.state.startsWith('round-') && after.currentQuestionIndex >= 4) {
        // End of a round, check answers and update scores
        const player1 = after.players[0];
        const player2 = after.players[1];
        
        const question = after.questions[after.currentQuestionIndex];
        
        if (player1.answers[after.currentQuestionIndex] === question.answer) player1.score += 10;
        if (player2.answers[after.currentQuestionIndex] === question.answer) player2.score += 10;
        
        if(after.state === 'round-1') {
            // End of round 1, start round 2
            const quizData2 = await generateQuiz({
              topic: after.players[1].topic,
              numQuestions: 5,
              difficulty: 'medium',
            });
            await db.collection("games").doc(gameId).update({
                players: [player1, player2],
                state: "round-2",
                round: 2,
                questions: quizData2.quiz,
                currentQuestionIndex: 0,
                "timestamps.round-2": admin.firestore.Timestamp.fromMillis(Date.now() + 120 * 1000),
            });
        } else {
            // End of round 2, finish game
            await db.collection("games").doc(gameId).update({
                players: [player1, player2],
                state: "finished",
            });
        }

    }
  });


// Cloud Function to handle game timeouts
export const handleGameTimeout = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // Handle topic selection timeouts
    const topicTimeoutQuery = db.collection('games').where('state', '==', 'topic-selection').where('timestamps.topic-selection', '<=', now);
    const topicSnaps = await topicTimeoutQuery.get();
    topicSnaps.forEach(async (doc) => {
        const game = doc.data();
        const allSubmitted = game.players.every((p: any) => p.topicSubmitted);
        if(!allSubmitted) {
            // Trigger the onUpdate logic by re-submitting with potentially random topics
            const updatedPlayers = game.players.map((p: any) => ({
                ...p,
                topic: p.topic || randomTopics[Math.floor(Math.random() * randomTopics.length)],
                topicSubmitted: true,
            }));
            await doc.ref.update({ players: updatedPlayers });
        }
    });

    // Handle round timeouts
    const round1TimeoutQuery = db.collection('games').where('state', '==', 'round-1').where('timestamps.round-1', '<=', now);
    const round1Snaps = await round1TimeoutQuery.get();
    round1Snaps.forEach(async (doc) => {
        const game = doc.data();
         const quizData2 = await generateQuiz({
              topic: game.players[1].topic,
              numQuestions: 5,
              difficulty: 'medium',
            });
        await doc.ref.update({
            state: 'round-2',
            round: 2,
            questions: quizData2.quiz,
            currentQuestionIndex: 0,
            "timestamps.round-2": admin.firestore.Timestamp.fromMillis(Date.now() + 120 * 1000),
        });
    });

    const round2TimeoutQuery = db.collection('games').where('state', '==', 'round-2').where('timestamps.round-2', '<=', now);
    const round2Snaps = await round2TimeoutQuery.get();
    round2Snaps.forEach(async (doc) => {
        await doc.ref.update({ state: 'finished' });
    });

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
    const gameDoc = await gameRef.get();
    const game = gameDoc.data();

    if (!game) {
         throw new functions.https.HttpsError('not-found', 'Game not found.');
    }

    const playerIndex = game.players.findIndex((p: any) => p.uid === uid);
    if(playerIndex === -1) {
         throw new functions.https.HttpsError('permission-denied', 'You are not a player in this game.');
    }
    
    // This is a simplified way. A more robust implementation would use a subcollection for answers.
    const updatePath = `players.${playerIndex}.answers.${questionIndex}`;
    
    await gameRef.update({ [updatePath]: answer });
    
    // Check if both players have answered
    const allAnswered = game.players.every((p:any) => p.answers && p.answers[questionIndex]);
    
    if(allAnswered || game.currentQuestionIndex < 4) { // Or if time runs out
        // Move to next question
        await gameRef.update({
            currentQuestionIndex: admin.firestore.FieldValue.increment(1)
        });
    }

    return { success: true };
});
