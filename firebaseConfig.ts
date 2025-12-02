import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// TODO: Replace these values with your actual Firebase Project keys
// You can find these in the Firebase Console -> Project Settings -> General -> Your Apps -> SDK Setup
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhpG7UUn_JY4ILv5SaK6ZphixMQLZoZvw",
  authDomain: "tatak-norte.firebaseapp.com",
  projectId: "tatak-norte",
  storageBucket: "tatak-norte.firebasestorage.app",
  messagingSenderId: "900146630542",
  appId: "1:900146630542:web:d700f349b2a58717a91edf",
  measurementId: "G-YTP5HN8G7L"
};

// Check if the config is still using default placeholders
export const isFirebaseConfigured = () => {
  return firebaseConfig.projectId !== "your-project-id" && 
         !firebaseConfig.projectId.includes("YOUR_PROJECT_ID");
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

if (!isFirebaseConfigured()) {
  console.info("⚠️ Firebase is not configured yet. App running in Demo Mode.");
}

export { auth, db, storage };
export default firebase;