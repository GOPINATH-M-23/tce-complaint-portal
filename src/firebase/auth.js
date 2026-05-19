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
    if (!snap.exists()) throw new Error('Student record not found. Contact admin.')
    if (!snap.data().active) throw new Error('Your account has been deactivated. Contact admin.')
    return { uid: cred.user.uid, ...snap.data(), role: 'student' }
  } catch (err) {
    if (err.message.startsWith('Student') || err.message.startsWith('Your account')) throw err
    throw new Error(friendlyAuthError(err))
  }
}

// ── Admin Login ───────────────────────────────────────────────────────────────
export const adminLogin = async (email, password) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    const snap = await getDoc(doc(db, 'admins', cred.user.uid))
    if (!snap.exists()) throw new Error('Not authorized as admin.')
    return { uid: cred.user.uid, ...snap.data(), role: 'admin' }
  } catch (err) {
    if (err.message === 'Not authorized as admin.') throw err
    throw new Error(friendlyAuthError(err))
  }
}

// ── Google OAuth — Student ────────────────────────────────────────────────────
export const studentGoogleLogin = async ({ dept = 'CSE', year = 1, phone = '', regNo = '' } = {}) => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    const cred = await signInWithPopup(auth, provider)
    const { uid, displayName, email, photoURL } = cred.user

    // Check if already in Firestore
    const snap = await getDoc(doc(db, 'students', uid))
    if (snap.exists()) {
      if (!snap.data().active) throw new Error('Your account has been deactivated. Contact admin.')
      // Refresh photoURL in case it changed
      await updateDoc(doc(db, 'students', uid), { photoURL: photoURL || '' })
      return { uid, ...snap.data(), photoURL: photoURL || '', role: 'student' }
    }

    // New Google student — create profile
    const studentId = email.split('@')[0].toLowerCase()
    const newProfile = {
      uid,
      name:      displayName || 'Student',
      email:     email.toLowerCase(),
      studentId,
      dept,
      year:      Number(year),
      phone:     phone || '',
      regNo:     regNo || '',
      photoURL:  photoURL || '',
      active:    true,
      authMethod: 'google',
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'students', uid), newProfile)
    return { ...newProfile, role: 'student' }
  } catch (err) {
    if (err.message.startsWith('Your account')) throw err
    throw new Error(friendlyAuthError(err))
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
export const logout = () => signOut(auth)

// ── Create student account (admin only) ──────────────────────────────────────
export const createStudentAccount = async (data) => {
  try {
    const email = `${data.studentId.toLowerCase()}@student.tce.edu`
    const cred  = await createUserWithEmailAndPassword(auth, email, data.password || 'TCE@123')
    await updateProfile(cred.user, { displayName: data.name })
    await setDoc(doc(db, 'students', cred.user.uid), {
      uid:       cred.user.uid,
      name:      data.name,
      email,
      studentId: data.studentId.toLowerCase(),
      dept:      data.dept,
      year:      data.year,
      phone:     data.phone || '',
      regNo:     data.regNo || '',
      photoURL:  '',
      active:    true,
      createdAt: serverTimestamp(),
    })
    return cred.user
  } catch (err) {
    throw new Error(friendlyAuthError(err))
  }
}

// ── Fetch current user profile ────────────────────────────────────────────────
export const fetchUserProfile = async (uid, role) => {
  const col  = role === 'admin' ? 'admins' : 'students'
  const snap = await getDoc(doc(db, col, uid))
  return snap.exists() ? { uid, ...snap.data(), role } : null
}

// ── Toggle student active status ──────────────────────────────────────────────
export const toggleStudentStatus = async (uid, active) => {
  await updateDoc(doc(db, 'students', uid), { active })
}

// ── Password reset ────────────────────────────────────────────────────────────
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (err) {
    throw new Error(friendlyAuthError(err))
  }
}

// ── Student Self-Signup (email/password) ─────────────────────────────────────
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
