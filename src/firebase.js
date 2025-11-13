// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// আপনার Firebase কনসোল থেকে কপি করা কনফিগ এখানে পেস্ট করুন
const firebaseConfig = {
  apiKey: "AIzaSyBGqWpLlUTRgqXAtEVOQx36shmLQia7zkM",
  authDomain: "horkoraevent.firebaseapp.com",
  projectId: "horkoraevent",
  storageBucket: "horkoraevent.firebasestorage.app",
  messagingSenderId: "156489323330",
  appId: "1:156489323330:web:a7d29a1a0d548023a9eedb",

};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);