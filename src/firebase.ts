import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  projectId: "least-count-mp-2026",
  appId: "1:58737796869:web:5e826166487638749e396c",
  storageBucket: "least-count-mp-2026.firebasestorage.app",
  apiKey: "AIzaSyDadCglmFKywj9QazizRPYKN999tdH232M",
  authDomain: "least-count-mp-2026.firebaseapp.com",
  messagingSenderId: "58737796869",
  databaseURL: "https://least-count-mp-2026-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
