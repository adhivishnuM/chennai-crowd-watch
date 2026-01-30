import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCmKXv8w3KMqfLbP3JI1LU_1m8dWiCkdr0",
    authDomain: "crowdexhize.firebaseapp.com",
    projectId: "crowdexhize",
    storageBucket: "crowdexhize.firebasestorage.app",
    messagingSenderId: "998909432848",
    appId: "1:998909432848:web:09757b5295339ffe0ea695",
    measurementId: "G-VK283ZECF4"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, analytics };
