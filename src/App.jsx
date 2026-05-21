import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ComplaintProvider } from '@/context/ComplaintContext'
import { ThemeProvider } from '@/context/ThemeContext'
import ProtectedRoute from '@/routes/ProtectedRoute'
import AdminRoute from '@/routes/AdminRoute'

// Pages
import LandingPage from '@/pages/LandingPage'
import StudentLogin from '@/pages/StudentLogin'
import AdminLogin from '@/pages/AdminLogin'
import StudentSignup from '@/pages/StudentSignup'

// Student pages
import StudentLayout from '@/layouts/StudentLayout'
import StudentDashboard from '@/pages/student/StudentDashboard'
import MyComplaints from '@/pages/student/MyComplaints'
import NewComplaint from '@/pages/student/NewComplaint'
import StudentNotifications from '@/pages/student/StudentNotifications'
import StudentProfile from '@/pages/student/StudentProfile'

// Admin pages
import AdminLayout from '@/layouts/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AllComplaints from '@/pages/admin/AllComplaints'
import ComplaintDetail from '@/pages/admin/ComplaintDetail'
import StudentManagement from '@/pages/admin/StudentManagement'
import Analytics from '@/pages/admin/Analytics'
import AdminSettings from '@/pages/admin/AdminSettings'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ComplaintProvider>
          <Routes>
            {/* Public */}
            <Route path="/"               element={<LandingPage />} />
            <Route path="/login/student"  element={<StudentLogin />} />
            <Route path="/login/admin"    element={<AdminLogin />} />
            <Route path="/signup"         element={<StudentSignup />} />

            {/* Student (protected) */}
            <Route element={<ProtectedRoute role="student" />}>
              <Route element={<StudentLayout />}>
                <Route path="/student"                  element={<StudentDashboard />} />
                <Route path="/student/complaints"       element={<MyComplaints />} />
                <Route path="/student/complaints/new"   element={<NewComplaint />} />
                <Route path="/student/notifications"    element={<StudentNotifications />} />
                <Route path="/student/profile"          element={<StudentProfile />} />
              </Route>
            </Route>

            {/* Admin (protected) */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin"                        element={<AdminDashboard />} />
                <Route path="/admin/complaints"             element={<AllComplaints />} />
                <Route path="/admin/complaints/:id"         element={<ComplaintDetail />} />
                <Route path="/admin/students"               element={<StudentManagement />} />
                <Route path="/admin/analytics"              element={<Analytics />} />
                <Route path="/admin/settings"               element={<AdminSettings />} />
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
