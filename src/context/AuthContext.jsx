import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { fetchUserProfile } from '@/firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Try admin first, then student — handles both email and Google auth
        let profile = await fetchUserProfile(firebaseUser.uid, 'admin')
        if (!profile) profile = await fetchUserProfile(firebaseUser.uid, 'student')

        if (profile) {
          // Refresh Google photoURL if available
          if (firebaseUser.photoURL && !profile.photoURL) {
            profile = { ...profile, photoURL: firebaseUser.photoURL }
          }
          setUser(profile)
        } else {
          // Firestore doc not found (e.g. Google user who hasn't completed signup)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading, isAdmin: user?.role === 'admin', isStudent: user?.role === 'student' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
