import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/ui/Spinner'

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner fullscreen />

  if (!user) return <Navigate to="/login/student" replace />

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />
  }

  return <Outlet />
}
