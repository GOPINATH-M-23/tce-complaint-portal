import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/ui/Spinner'

export default function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner fullscreen />
  if (!user)              return <Navigate to="/login/admin" replace />
  if (user.role !== 'admin') return <Navigate to="/student" replace />
  return <Outlet />
}
