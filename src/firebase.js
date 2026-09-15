import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5PY7mfdk9BgqNSK3M_fUJEcxCofrv_B8",
  authDomain: "asma-villa.firebaseapp.com",
  projectId: "asma-villa",
  storageBucket: "asma-villa.firebasestorage.app",
  messagingSenderId: "716523174817",
  appId: "1:716523174817:web:280f35b0832f6cd298e9e0",
  measurementId: "G-HR5MWHQXKS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
