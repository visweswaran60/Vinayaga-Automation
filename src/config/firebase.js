import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD2_3ttfpJnGs9paptUJumttvXqGKNXLZ0",
    authDomain: "vinayaga-automation.firebaseapp.com",
    projectId: "vinayaga-automation",
    storageBucket: "vinayaga-automation.firebasestorage.app",
    messagingSenderId: "296762519931",
    appId: "1:296762519931:web:7044a2d7e2e81ec8154dde",
    measurementId: "G-KG8YMSX6GW"
};

// Guard against Vite HMR re-initializing the app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
