// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we have the minimum required config
const hasRequiredConfig = firebaseConfig.apiKey && 
                          firebaseConfig.authDomain && 
                          firebaseConfig.projectId;

console.log('🔥 Firebase config check:', {
  hasRequiredConfig,
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
  authDomain: firebaseConfig.authDomain || 'Missing',
  projectId: firebaseConfig.projectId || 'Missing'
});

let app: any = null;
let auth: any = null;
let googleProvider: any = null;

if (hasRequiredConfig) {
  // Initialize Firebase only if we have the required config
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  
  // Set persistence to LOCAL (default) but log it
  setPersistence(auth, browserLocalPersistence).then(() => {
    console.log('🔥 Firebase persistence set to LOCAL');
  }).catch((error) => {
    console.warn('🔥 Failed to set Firebase persistence:', error);
  });
  
  console.log('🔥 Firebase initialized successfully');
  
  googleProvider = new GoogleAuthProvider();
} else {
  console.warn('🔥 Firebase not initialized - missing required environment variables');
}

export { auth, googleProvider };
export default app; 