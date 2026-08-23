import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/ui/Spinner'

export default function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />

  return <Outlet />
}
