// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCysfLskL2bpfzUEDDOuNr0dv4_ZarnHyc",
  authDomain: "asra-tutor.firebaseapp.com",
  projectId: "asra-tutor",
  storageBucket: "asra-tutor.firebasestorage.app",
  messagingSenderId: "1039365743361",
  appId: "1:1039365743361:web:7d4602a2e025df05083100"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
