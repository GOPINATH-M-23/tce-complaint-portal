import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import {
  subscribeStudentComplaints,
  subscribeAllComplaints,
  subscribeNotifications,
} from '@/firebase/complaints'

const ComplaintContext = createContext(null)

export function ComplaintProvider({ children }) {
  const { user } = useAuth()
  const [complaints,     setComplaints]     = useState([])
  const [notifications,  setNotifications]  = useState([])
  const [loadingComps,   setLoadingComps]   = useState(true)

  useEffect(() => {
    if (!user) { setComplaints([]); setNotifications([]); setLoadingComps(false); return }

    setLoadingComps(true)
    let unsub1, unsub2

    if (user.role === 'admin') {
      unsub1 = subscribeAllComplaints((data) => {
        setComplaints(data)
        setLoadingComps(false)
      })
    } else {
      unsub1 = subscribeStudentComplaints(user.studentId || user.uid, (data) => {
        setComplaints(data)
        setLoadingComps(false)
      })
    }

    unsub2 = subscribeNotifications(user.studentId || user.uid, setNotifications)

    return () => { unsub1?.(); unsub2?.() }
  }, [user])

  const unreadNotifs = notifications.filter((n) => !n.read).length

  return (
    <ComplaintContext.Provider value={{ complaints, notifications, unreadNotifs, loadingComps }}>
      {children}
    </ComplaintContext.Provider>
  )
}

export const useComplaints = () => {
  const ctx = useContext(ComplaintContext)
  if (!ctx) throw new Error('useComplaints must be inside ComplaintProvider')
  return ctx
}
