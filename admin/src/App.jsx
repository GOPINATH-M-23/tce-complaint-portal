import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ComplaintProvider } from '@/context/ComplaintContext'
import { ThemeProvider } from '@/context/ThemeContext'
import AdminRoute from '@/routes/AdminRoute'

// Public Admin Pages
import AdminLandingPage from '@/pages/AdminLandingPage'
import AdminLogin from '@/pages/AdminLogin'
import ResetPassword from '@/pages/ResetPassword'

// Admin Pages & Layout
import AdminLayout from '@/layouts/AdminLayout'
import AdminDashboard from '@/pages/AdminDashboard'
import AllComplaints from '@/pages/AllComplaints'
import ComplaintDetail from '@/pages/ComplaintDetail'
import StudentManagement from '@/pages/StudentManagement'
import Analytics from '@/pages/Analytics'
import AdminSettings from '@/pages/AdminSettings'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ComplaintProvider>
          <Routes>
            {/* Public Admin Landing Page & Login */}
            <Route path="/"               element={<AdminLandingPage />} />
            <Route path="/login"          element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/dashboard"       element={<AdminDashboard />} />
                <Route path="/complaints"     element={<AllComplaints />} />
                <Route path="/complaints/:id" element={<ComplaintDetail />} />
                <Route path="/students"       element={<StudentManagement />} />
                <Route path="/analytics"      element={<Analytics />} />
                <Route path="/settings"       element={<AdminSettings />} />
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
