import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  where, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';

// Configuration from our custom user project
const firebaseConfig = {
  apiKey: "AIzaSyBVN7xli_mLhQfrd8oPY4oyLbAw5-XNKNk",
  authDomain: "civiq-ai-7d0c1.firebaseapp.com",
  projectId: "civiq-ai-7d0c1",
  storageBucket: "civiq-ai-7d0c1.firebasestorage.app",
  messagingSenderId: "960901427571",
  appId: "1:960901427571:web:ced3d23211da5ed34e9506",
  measurementId: "G-5EJ8ZEDDD0"
};

const app = initializeApp(firebaseConfig);

// Initialize Analytics safely (checking environment support)
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Analytics not supported or blocked in this environment:", err);
});

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

export { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  where, 
  limit, 
  onSnapshot 
};
