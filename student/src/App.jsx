import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ComplaintProvider } from '@/context/ComplaintContext'
import { ThemeProvider } from '@/context/ThemeContext'
import ProtectedRoute from '@/routes/ProtectedRoute'

// Public Pages
import LandingPage from '@/pages/LandingPage'
import StudentLogin from '@/pages/StudentLogin'
import StudentSignup from '@/pages/StudentSignup'
import ResetPassword from '@/pages/ResetPassword'

// Student Pages & Layout
import StudentLayout from '@/layouts/StudentLayout'
import StudentDashboard from '@/pages/StudentDashboard'
import MyComplaints from '@/pages/MyComplaints'
import NewComplaint from '@/pages/NewComplaint'
import StudentNotifications from '@/pages/StudentNotifications'
import StudentProfile from '@/pages/StudentProfile'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ComplaintProvider>
          <Routes>
            {/* Public Student Landing Page at root "/" */}
            <Route path="/"               element={<LandingPage />} />
            <Route path="/login"          element={<StudentLogin />} />
            <Route path="/signup"         element={<StudentSignup />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Student Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<StudentLayout />}>
                <Route path="/dashboard"       element={<StudentDashboard />} />
                <Route path="/complaints"     element={<MyComplaints />} />
                <Route path="/complaints/new" element={<NewComplaint />} />
                <Route path="/notifications"  element={<StudentNotifications />} />
                <Route path="/profile"        element={<StudentProfile />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ComplaintProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
