// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIc2Zot63gZgn_-9XE9Fab4MF-FH5J0OY",
  authDomain: "asra-tutor.firebaseapp.com",
  projectId: "asra-tutor",
  storageBucket: "asra-tutor.appspot.com",
  messagingSenderId: "1039365743361",
  appId: "1:1039365743361:web:7d4602a2e025df05083100"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
