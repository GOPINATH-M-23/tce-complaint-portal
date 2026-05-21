import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { fetchUserProfile } from '@/firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Try admin first, then student — handles both email and Google auth
          let profile = await fetchUserProfile(firebaseUser.uid, 'admin')
          if (!profile) profile = await fetchUserProfile(firebaseUser.uid, 'student')

          if (profile) {
            // Refresh Google photoURL if available
            if (firebaseUser.photoURL && !profile.photoURL) {
              profile = { ...profile, photoURL: firebaseUser.photoURL }
            }
            setUser(profile)
            setError(null)
          } else {
            // Firestore doc not found — signed out of invalid state
            setUser(null)
          }
        } catch (err) {
          setError(err.message)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // refreshUser: re-fetches the Firestore profile without a full page reload
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return
    try {
      const role    = user?.role || 'student'
      const profile = await fetchUserProfile(auth.currentUser.uid, role)
      if (profile) setUser(profile)
    } catch { /* ignore */ }
  }, [user?.role])

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      error,
      refreshUser,
      isAdmin:   user?.role === 'admin',
      isStudent: user?.role === 'student',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
