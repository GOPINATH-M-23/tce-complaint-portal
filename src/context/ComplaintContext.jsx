import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeStudentComplaints,
  subscribeAllComplaints,
  subscribeNotifications,
} from '@/firebase/complaints'

const ComplaintContext = createContext(null)

export function ComplaintProvider({ children }) {
  const { user }  = useAuth()
  const [complaints,    setComplaints]    = useState([])
  const [notifications, setNotifications] = useState([])
  const [loadingComps,  setLoadingComps]  = useState(true)
  const [compError,     setCompError]     = useState(null)

  useEffect(() => {
    if (!user) {
      setComplaints([])
      setNotifications([])
      setLoadingComps(false)
      return
    }

    setLoadingComps(true)
    setCompError(null)
    let unsub1, unsub2

    const handleError = (err) => {
      setCompError(err?.message || 'Failed to load complaints.')
      setLoadingComps(false)
    }

    if (user.role === 'admin') {
      unsub1 = subscribeAllComplaints(
        (data) => { setComplaints(data); setLoadingComps(false) },
        handleError,
      )
    } else {
      unsub1 = subscribeStudentComplaints(
        user.studentId || user.uid,
        (data) => { setComplaints(data); setLoadingComps(false) },
        handleError,
      )
    }

    unsub2 = subscribeNotifications(user.studentId || user.uid, setNotifications)

    return () => { unsub1?.(); unsub2?.() }
  }, [user])

  const unreadNotifs = notifications.filter((n) => !n.read).length

  return (
    <ComplaintContext.Provider value={{
      complaints,
      notifications,
      unreadNotifs,
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
