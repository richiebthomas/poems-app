import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {

    apiKey: "AIzaSyASrsTmX5LX2vWt3K6Ppfcu9i-1JoCTUWE",
  
    authDomain: "poems-app-c581e.firebaseapp.com",
  
    projectId: "poems-app-c581e",
  
    storageBucket: "poems-app-c581e.firebasestorage.app",
  
    messagingSenderId: "1019722992978",
  
    appId: "1:1019722992978:web:1f857d73d2ce7efceb3e8b"
  
  };
  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
  }
};

export const logout = async () => {
  await signOut(auth);
};
