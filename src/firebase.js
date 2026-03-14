import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
    apiKey: "AIzaSyBp9xn65ifG3iqiNTSINCABb7-YcmbDexY",
    authDomain: "khoatk-user-app.firebaseapp.com",
    projectId: "khoatk-user-app",
    storageBucket: "khoatk-user-app.firebasestorage.app",
    messagingSenderId: "325737382362",
    appId: "1:325737382362:web:c72eb6a2c6d39f7fa2c0e3",
    measurementId: "G-5E8C3HTLXV"
  };

const app = initializeApp(firebaseConfig);

// Initialize analytics only in browser environment
if (typeof window !== 'undefined') {
  try {
    getAnalytics(app);
  } catch (error) {
    console.log('Analytics initialization skipped:', error);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
