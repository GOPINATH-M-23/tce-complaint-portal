/**
 * Firebase Authentication middleware for Netlify Functions.
 *
 * Usage:
 *   import { requireAuth, requireAdmin } from './_middleware/auth.js'
 *
 *   // In a function handler:
 *   const decoded = await requireAuth(event, origin)
 *   // decoded = { uid, email, role, studentId, ... }
 *
 * How it works:
 *   1. Extract the Bearer token from Authorization header
 *   2. Verify the ID token with Firebase Admin SDK (checks signature, expiry, issuer)
 *   3. Look up the user's Firestore document to confirm role + active status
 *   4. Return the decoded user profile
 *
 * Security guarantees:
 *   - Token is cryptographically verified (not just decoded)
 *   - Revoked tokens are rejected (checkRevoked: true)
 *   - Admin impersonation is impossible — role comes from Firestore, not token claims
 *   - Deactivated students are blocked server-side
 */

import { initAdmin }    from '../_utils/firebaseAdmin.js'
import { unauthorized } from '../_utils/response.js'
import { logger }       from '../_utils/logger.js'

/**
 * Extract and verify a Firebase ID token from the Authorization header.
 * Returns the decoded token payload { uid, email, ... }.
 * Throws a Netlify response object on failure (so callers can return it directly).
 */
export const verifyToken = async (event, origin) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''

  if (!authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or malformed Authorization header', { path: event.path })
    throw unauthorized(origin)
  }

  const idToken = authHeader.slice(7).trim()
  if (!idToken) {
    throw unauthorized(origin)
  }

  try {
    const { auth } = initAdmin()
    // checkRevoked: true — rejects tokens that have been explicitly revoked
    const decoded  = await auth.verifyIdToken(idToken, true)
    return decoded
  } catch (err) {
    logger.warn('Token verification failed', { error: err.code || err.message })
    throw unauthorized(origin)
  }
}

/**
 * Verify token AND confirm the user exists as an active student in Firestore.
 * Returns the merged { uid, email, role: 'student', ...firestoreProfile }
 */
export const requireAuth = async (event, origin) => {
  const decoded = await verifyToken(event, origin)
  const { db }  = initAdmin()

  // Try student first (most common)
  const studentSnap = await db.collection('students').doc(decoded.uid).get()
  if (studentSnap.exists) {
    const data = studentSnap.data()
    if (!data.active) {
      logger.warn('Deactivated student attempted access', { uid: decoded.uid })
      throw unauthorized(origin)
    }
    return { uid: decoded.uid, ...data, role: 'student' }
  }

  // Fall back to admin
  const adminSnap = await db.collection('admins').doc(decoded.uid).get()
  if (adminSnap.exists) {
    return { uid: decoded.uid, ...adminSnap.data(), role: 'admin' }
  }

  logger.warn('Auth user has no Firestore profile', { uid: decoded.uid })
  throw unauthorized(origin)
}

/**
 * Verify token AND confirm the user is an admin.
 * Returns the admin profile.
 */
export const requireAdmin = async (event, origin) => {
  const decoded = await verifyToken(event, origin)
  const { db }  = initAdmin()

  const snap = await db.collection('admins').doc(decoded.uid).get()
  if (!snap.exists) {
    logger.warn('Non-admin attempted admin endpoint', { uid: decoded.uid })
    throw unauthorized(origin)
  }

  return { uid: decoded.uid, ...snap.data(), role: 'admin' }
}
