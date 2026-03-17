import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDIH1p7Nj7qtqlyNTT4g2dkx0oC3QedLsk",
  authDomain: "askmily.firebaseapp.com",
  projectId: "askmily",
  storageBucket: "askmily.firebasestorage.app",
  messagingSenderId: "4653532267",
  appId: "1:4653532267:web:5518d64d22f14cd3c55d2e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export default app;

