import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/ui/Spinner'

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner fullscreen />

  // Not logged in → redirect to appropriate login page
  if (!user) {
    return <Navigate to={role === 'admin' ? '/login/admin' : '/login/student'} replace />
  }

  // Wrong role → redirect to own dashboard (prevents students hitting admin routes)
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />
  }

  return <Outlet />
}
