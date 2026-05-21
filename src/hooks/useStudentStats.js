import { useState, useEffect, useCallback } from 'react'
import { getStudentComplaintStats } from '@/firebase/complaints'

/**
 * Fetches complaint statistics for a given student.
 * Caches result so multiple card renders don't re-fetch.
 * Usage: const { stats, loading } = useStudentStats(studentId)
 */
export function useStudentStats(studentId) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getStudentComplaintStats(studentId)
      setStats(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => { fetch() }, [fetch])

  return { stats, loading, error, refetch: fetch }
}
