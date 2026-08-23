import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { subscribeAllComplaints } from '@/firebase/complaints'

const ComplaintContext = createContext(null)

export function ComplaintProvider({ children }) {
  const { user }  = useAuth()
  const [complaints,    setComplaints]    = useState([])
  const [loadingComps,  setLoadingComps]  = useState(true)
  const [compError,     setCompError]     = useState(null)

  useEffect(() => {
    if (!user) {
      setComplaints([])
      setLoadingComps(false)
      return
    }

    setLoadingComps(true)
    setCompError(null)
    let unsub

    const handleError = (err) => {
      setCompError(err?.message || 'Failed to load complaints.')
      setLoadingComps(false)
    }

    unsub = subscribeAllComplaints(
      (data) => {
        // Guaranteed single complaint per Firestore doc ID
        setComplaints(data)
        setLoadingComps(false)
      },
      handleError,
    )

    return () => { unsub?.() }
  }, [user])

  return (
    <ComplaintContext.Provider value={{
      complaints,
      loadingComps,
      compError,
    }}>
      {children}
    </ComplaintContext.Provider>
  )
}

export const useComplaints = () => {
  const ctx = useContext(ComplaintContext)
  if (!ctx) throw new Error('useComplaints must be inside ComplaintProvider')
  return ctx
}
