/**
 * Reusable hook that wraps the ComplaintContext for components
 * that need complaints with optional local filtering.
 * Avoids duplicate subscriptions — reuses the single context listener.
 */
import { useMemo } from 'react'
import { useComplaints } from '@/context/ComplaintContext'

export function useRealtimeComplaints({ status, category, studentId } = {}) {
  const { complaints, loadingComps, notifications, unreadNotifs } = useComplaints()

  const filtered = useMemo(() => {
    let list = complaints
    if (status)    list = list.filter((c) => c.status === status)
    if (category)  list = list.filter((c) => c.category === category)
    if (studentId) list = list.filter((c) => c.studentId === studentId)
    return list
  }, [complaints, status, category, studentId])

  return { complaints: filtered, allComplaints: complaints, loadingComps, notifications, unreadNotifs }
}
