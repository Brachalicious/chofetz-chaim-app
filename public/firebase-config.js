// Firebase configuration
// Replace these with your actual Firebase project credentials
// Get them from: https://console.firebase.google.com/

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDg8O6k0_rnnLe-0WR7CV4b_7ym039P_gM",
  authDomain: "shmiras-halashon-app-60a50.firebaseapp.com",
  projectId: "shmiras-halashon-app-60a50",
  storageBucket: "shmiras-halashon-app-60a50.firebasestorage.app",
  messagingSenderId: "487267004356",
  appId: "1:487267004356:web:4f633e5c6e9e972b27fe91",
  measurementId: "G-3FV3JFLCE4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, limit };

