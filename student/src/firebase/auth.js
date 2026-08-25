import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { friendlyAuthError } from '@/utils/authErrors'

// ── Validate student email domain ─────────────────────────────────────────────
const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.tce\.edu$/i

export const isValidStudentEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  return STUDENT_EMAIL_REGEX.test(email.trim())
}

// ── Student Login ─────────────────────────────────────────────────────────────
export const studentLogin = async (email, password) => {
  const trimmed = email.trim().toLowerCase()
  if (!isValidStudentEmail(trimmed)) {
    throw new Error('Please use your official @student.tce.edu email address.')
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, trimmed, password)

    if (!cred.user.emailVerified) {
      await signOut(auth)
      const err = new Error('Please verify your email address before logging in.')
      err.code = 'auth/email-not-verified'
      throw err
    }

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
    if (
      err.message.startsWith('Please verify your email') ||
      err.message.startsWith('Student') ||
      err.message.startsWith('Your account') ||
      err.message.startsWith('Please use your official') ||
      err.message.startsWith('Only @student')
    ) throw err
    throw new Error(friendlyAuthError(err))
  }
}

// ── Resend Student Email Verification ─────────────────────────────────────────
export const resendStudentVerification = async (email, password) => {
  const trimmed = email.trim().toLowerCase()
  if (!isValidStudentEmail(trimmed)) {
    throw new Error('Please use your official @student.tce.edu email address.')
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, trimmed, password)
    if (cred.user.emailVerified) {
      await signOut(auth)
      throw new Error('Your email address is already verified. You can log in directly.')
    }
    await sendEmailVerification(cred.user)
    await signOut(auth)
    return true
  } catch (err) {
    if (
      err.message.includes('already verified') ||
      err.message.startsWith('Please use your official') ||
      err.message.startsWith('Only @student')
    ) throw err
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
      throw new Error('Please use your official @student.tce.edu email address.')
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
    if (err.message.startsWith('No student') || err.message.startsWith('Your account') || err.message.startsWith('Please use your official') || err.message.startsWith('Only @student')) throw err
    throw new Error(friendlyAuthError(err))
  }
}

// ── Send Student OTP ──────────────────────────────────────────────────────────
export const sendStudentOtp = async (email) => {
  const trimmed = email ? email.trim().toLowerCase() : ''
  if (!isValidStudentEmail(trimmed)) {
    throw new Error('Please use your official @student.tce.edu email address.')
  }
  const res = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: trimmed }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send verification code.')
  }
  return data
}

// ── Verify Student OTP ────────────────────────────────────────────────────────
export const verifyStudentOtp = async (email, otp, challenge, expiresAt) => {
  const trimmedEmail = email ? email.trim().toLowerCase() : ''
  const trimmedOtp   = otp   ? otp.trim() : ''
  if (!isValidStudentEmail(trimmedEmail)) {
    throw new Error('Please use your official @student.tce.edu email address.')
  }
  if (!trimmedOtp || !/^\d{6}$/.test(trimmedOtp)) {
    throw new Error('Invalid verification code.')
  }
  const res = await fetch('/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: trimmedEmail, otp: trimmedOtp, challenge, expiresAt }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Invalid verification code.')
  }
  return data
}

// ── Update Student Year ───────────────────────────────────────────────────────
export const updateStudentYear = async (email, otp, challenge, expiresAt, newYear) => {
  const trimmedEmail = email ? email.trim().toLowerCase() : ''
  const trimmedOtp   = otp   ? otp.trim() : ''
  if (!isValidStudentEmail(trimmedEmail)) {
    throw new Error('Please use your official @student.tce.edu email address.')
  }
  if (!trimmedOtp || !/^\d{6}$/.test(trimmedOtp)) {
    throw new Error('Invalid verification code.')
  }
  const res = await fetch('/api/update-year', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: trimmedEmail, otp: trimmedOtp, challenge, expiresAt, newYear }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Invalid verification code.')
  }
  return data
}

// ── Student Self-Signup (email/password only) ─────────────────────────────────
export const studentSignup = async ({ name, email, dept, year, password, phone = '', regNo = '', rollNo = '' }) => {
  const trimmed = email.trim().toLowerCase()
  if (!isValidStudentEmail(trimmed)) {
    throw new Error('Please use your official @student.tce.edu email address.')
  }

  const studentId = trimmed.split('@')[0]

  // Verify against studentRegistry collection if present
  try {
    const regSnap = await getDoc(doc(db, 'studentRegistry', studentId))
    if (regSnap.exists()) {
      const regData = regSnap.data()
      if (regData.active === false) {
        throw new Error('Your student registration is currently inactive. Please contact the administrator.')
      }
      if (regData.regNo && regNo && regData.regNo.trim().toUpperCase() !== regNo.trim().toUpperCase()) {
        throw new Error('The registration number does not match the approved student record.')
      }
      if (regData.email && regData.email.trim().toLowerCase() !== trimmed) {
        throw new Error('Your TCE student email is not authorized for registration.')
      }
    }
  } catch (regErr) {
    if (
      regErr.message.startsWith('Your student') ||
      regErr.message.startsWith('The registration') ||
      regErr.message.startsWith('Your TCE')
    ) {
      throw regErr
    }
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, trimmed, password)
    await updateProfile(cred.user, { displayName: name })

    // Send Firebase email verification email
    await sendEmailVerification(cred.user)

    const profile = {
      uid:       cred.user.uid,
      name,
      email:     trimmed,
      studentId,
      dept,
      year:      Number(year),
      phone:     phone || '',
      regNo:     regNo || '',
      rollNo:    rollNo || '',
      photoURL:  '',
      active:    true,
      authMethod: 'email',
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'students', cred.user.uid), profile)

    // Sign out user so they are not logged in as unverified
    await signOut(auth)

    return { ...profile, role: 'student', emailVerificationSent: true }
  } catch (err) {
    if (
      err.message.startsWith('Please use your official') ||
      err.message.startsWith('Only @student') ||
      err.message.startsWith('Your student') ||
      err.message.startsWith('The registration') ||
      err.message.startsWith('Your TCE')
    ) {
      throw err
    }
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
  const trimmed = email ? email.trim().toLowerCase() : ''
  if (!trimmed) {
    throw new Error('Please enter your college email address.')
  }
  if (!isValidStudentEmail(trimmed)) {
    throw new Error('Only @student.tce.edu email addresses are allowed.')
  }

  const actionCodeSettings = {
    url: typeof window !== 'undefined' && window.location.origin.includes('localhost')
      ? `${window.location.origin}/reset-password`
      : 'https://tce-student-portal.vercel.app/reset-password',
    handleCodeInApp: true,
  }

  try {
    await sendPasswordResetEmail(auth, trimmed, actionCodeSettings)
  } catch (err) {
    console.warn('[resetPassword Attempt 1 failed]', {
      code: err?.code,
      message: err?.message,
    })
    // Fallback if actionCodeSettings domain is unauthorized or fails
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
