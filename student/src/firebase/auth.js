import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { friendlyAuthError } from '@/utils/authErrors'

// ── Validate student email domain ─────────────────────────────────────────────
export const isValidStudentEmail = (email) =>
  email.trim().toLowerCase().endsWith('@student.tce.edu')

// ── Student Login ─────────────────────────────────────────────────────────────
export const studentLogin = async (email, password) => {
  const trimmed = email.trim().toLowerCase()
  if (!isValidStudentEmail(trimmed)) {
    throw new Error('Only @student.tce.edu email addresses are allowed.')
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, trimmed, password)
    const snap = await getDoc(doc(db, 'students', cred.user.uid))
    if (!snap.exists()) throw new Error('Student record not found. Please register your account first.')
    if (!snap.data().active) throw new Error('Your account has been deactivated. Contact admin.')
    return { uid: cred.user.uid, ...snap.data(), role: 'student' }
  } catch (err) {
    console.error('[studentLogin Error]', {
      code: err?.code,
      message: err?.message,
      operation: 'studentLogin',
    })
    if (err.message.startsWith('Student') || err.message.startsWith('Your account') || err.message.startsWith('Only @student')) throw err
    throw new Error(friendlyAuthError(err))
  }
}

// ── Student Google OAuth — LOGIN ONLY (Does not create accounts) ─────────────
export const studentGoogleLogin = async () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    const cred = await signInWithPopup(auth, provider)
    const { uid, email, photoURL } = cred.user

    // Enforce college domain for Google sign-in
    if (!isValidStudentEmail(email)) {
      await signOut(auth)
      throw new Error('Only @student.tce.edu Google accounts are allowed.')
    }

    // Check if student already registered in Firestore
    const snap = await getDoc(doc(db, 'students', uid))

    if (!snap.exists()) {
      // Reject auto-creation: Google is LOGIN ONLY
      await signOut(auth)
      throw new Error('No student account found for this Google email. Please create an account using Email & Password signup first.')
    }

    if (!snap.data().active) {
      await signOut(auth)
      throw new Error('Your account has been deactivated. Contact admin.')
    }

    // Refresh photoURL in case it changed
    if (photoURL) {
      await updateDoc(doc(db, 'students', uid), { photoURL }).catch(() => {})
    }
    return { uid, ...snap.data(), photoURL: photoURL || snap.data().photoURL || '', role: 'student' }
  } catch (err) {
    console.error('[studentGoogleLogin Error]', {
      code: err?.code,
      message: err?.message,
      operation: 'studentGoogleLogin',
    })
    if (err.message.startsWith('No student') || err.message.startsWith('Your account') || err.message.startsWith('Only @student')) throw err
    throw new Error(friendlyAuthError(err))
  }
}

// ── Student Self-Signup (email/password only) ─────────────────────────────────
export const studentSignup = async ({ name, email, dept, year, password, phone = '', regNo = '' }) => {
  const trimmed = email.trim().toLowerCase()
  if (!isValidStudentEmail(trimmed)) {
    throw new Error('Only @student.tce.edu email addresses are allowed.')
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, trimmed, password)
    await updateProfile(cred.user, { displayName: name })
    const studentId = trimmed.split('@')[0]
    const profile = {
      uid:       cred.user.uid,
      name,
      email:     trimmed,
      studentId,
      dept,
      year:      Number(year),
      phone:     phone || '',
      regNo:     regNo || '',
      photoURL:  '',
      active:    true,
      authMethod: 'email',
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'students', cred.user.uid), profile)
    return { ...profile, role: 'student' }
  } catch (err) {
    if (err.message.startsWith('Only @student')) throw err
    throw new Error(friendlyAuthError(err))
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
export const logout = () => signOut(auth)

// ── Fetch current user profile ────────────────────────────────────────────────
export const fetchUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'students', uid))
  return snap.exists() ? { uid, ...snap.data(), role: 'student' } : null
}

// ── Password reset ────────────────────────────────────────────────────────────
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (err) {
    throw new Error(friendlyAuthError(err))
  }
}
