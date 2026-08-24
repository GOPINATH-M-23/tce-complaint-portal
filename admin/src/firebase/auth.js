import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { friendlyAuthError } from '@/utils/authErrors'

// ── Admin Login (Email / Password) ────────────────────────────────────────────
export const adminLogin = async (email, password) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    const snap = await getDoc(doc(db, 'admins', cred.user.uid))
    if (!snap.exists()) {
      await signOut(auth)
      throw new Error('Access denied. This account is not registered as an admin.')
    }
    return { uid: cred.user.uid, ...snap.data(), role: 'admin' }
  } catch (err) {
    if (err.message.startsWith('Access denied')) throw err
    throw new Error(friendlyAuthError(err))
  }
}

// ── Admin Google Login (LOGIN ONLY — Authorized Admins Only) ──────────────────
export const adminGoogleLogin = async () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    const cred = await signInWithPopup(auth, provider)
    const { uid, email } = cred.user

    // First check admins collection by UID
    let snap = await getDoc(doc(db, 'admins', uid))
    let adminData = snap.exists() ? snap.data() : null

    // If not found by UID, check admins collection by Email
    if (!adminData && email) {
      const q = query(collection(db, 'admins'), where('email', '==', email.toLowerCase()))
      const querySnap = await getDocs(q)
      if (!querySnap.empty) {
        adminData = querySnap.docs[0].data()
      }
    }

    if (!adminData) {
      await signOut(auth)
      throw new Error('Access denied. This Google account is not authorized as an admin.')
    }

    return { uid, ...adminData, role: 'admin' }
  } catch (err) {
    if (err.message.startsWith('Access denied')) throw err
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
export const fetchUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'admins', uid))
  return snap.exists() ? { uid, ...snap.data(), role: 'admin' } : null
}

// ── Toggle student active status ──────────────────────────────────────────────
export const toggleStudentStatus = async (uid, active) => {
  await updateDoc(doc(db, 'students', uid), { active })
}

// ── Password reset ────────────────────────────────────────────────────────────
export const resetPassword = async (email) => {
  const trimmed = email ? email.trim() : ''
  if (!trimmed) {
    throw new Error('Please enter your admin email address.')
  }

  const actionCodeSettings = {
    url: typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}/reset-password`
      : 'https://tce-admin-portal.vercel.app/reset-password',
    handleCodeInApp: true,
  }

  try {
    await sendPasswordResetEmail(auth, trimmed, actionCodeSettings)
  } catch (err) {
    console.warn('[resetPassword Attempt 1 failed]', {
      code: err?.code,
      message: err?.message,
    })
    if (err?.code === 'auth/unauthorized-continue-uri' || err?.code === 'auth/invalid-continue-uri') {
      try {
        await sendPasswordResetEmail(auth, trimmed)
      } catch (fallbackErr) {
        console.error('[resetPassword Fallback Error]', fallbackErr)
        throw new Error(friendlyAuthError(fallbackErr))
      }
    } else {
      throw new Error(friendlyAuthError(err))
    }
  }
}
