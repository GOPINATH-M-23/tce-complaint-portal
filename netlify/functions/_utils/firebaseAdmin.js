/**
 * Firebase Admin SDK — singleton initializer for Netlify Functions.
 *
 * Why singleton: Netlify reuses warm function instances between invocations.
 * Re-initializing the app on every request wastes time and may throw errors
 * if the app is already initialized. This module ensures exactly one init.
 *
 * Credentials come from environment variables only — never hardcoded.
 *
 * Setup:
 *   Firebase Console → Project Settings → Service Accounts
 *   → Generate New Private Key → copy fields to .env / Netlify env vars
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth }      from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

let _app    = null
let _auth   = null
let _db     = null

const initAdmin = () => {
  if (_app) return { app: _app, auth: _auth, db: _db }

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, ' +
      'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in environment variables.',
    )
  }

  // Restore escaped newlines from env var string
  const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

  // Avoid "app already exists" error on warm re-use
  _app = getApps().length === 0
    ? initializeApp({ credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey }) })
    : getApps()[0]

  _auth = getAuth(_app)
  _db   = getFirestore(_app)

  // Firestore settings: disable deprecated behavior
  _db.settings({ ignoreUndefinedProperties: true })

  return { app: _app, auth: _auth, db: _db }
}

export { initAdmin }
