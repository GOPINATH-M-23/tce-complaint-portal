// ─────────────────────────────────────────────────────────────────────────────
//  Firebase Configuration — TCE Smart Complaint Portal
//
//  Setup:
//    1. Go to https://console.firebase.google.com
//    2. Create project "tce-complaint-portal"
//    3. Enable Authentication → Email/Password AND Google
//    4. Enable Firestore Database
//    5. Register a Web App and copy the config below
//    6. Set values in your .env file (see .env.example)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth }       from 'firebase/auth'
import { getFirestore }  from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyB8QL_aVDAsaa9cX9ugOReGS3XkWSDWtzg',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'tcestudents-d15be.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'tcestudents-d15be',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'tcestudents-d15be.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '930603993534',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:930603993534:web:5517df3fcbc50129ed51ef',
}
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export default app