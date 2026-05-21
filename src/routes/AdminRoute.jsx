import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/ui/Spinner'

export default function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner fullscreen />

  // Not logged in → admin login page
  if (!user) return <Navigate to="/login/admin" replace />

  // Logged in but not admin → student dashboard (no admin access)
  if (user.role !== 'admin') return <Navigate to="/student" replace />

  return <Outlet />
}
