import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useComplaints } from '@/context/ComplaintContext'
import { resetPassword } from '@/firebase/auth'
import ComplaintExportSection from '@/components/ComplaintExportSection'
import toast from 'react-hot-toast'
import { Sun, Moon } from 'lucide-react'

export default function AdminSettings() {
  const { user }           = useAuth()
  const { dark, toggle }   = useTheme()
  const { complaints }     = useComplaints()
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetPassword(user.email)
      toast.success('Password reset email sent!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setResetting(false)
    }
  }

  const handleExport = () => {
    const headers = ['Title', 'Category', 'Status', 'Priority', 'Student', 'StudentID', 'Dept', 'Date', 'Reply']
    const rows = complaints.map((c) => [
      c.title, c.category, c.status, c.priority,
      c.studentName, c.studentId, c.dept,
      c.createdAt?.toDate?.().toLocaleDateString('en-IN') || '',
      c.adminReply || '',
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `tce-complaints-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('CSV exported!')
  }

  const Section = ({ title, children }) => (
    <div className="card">
      <h2 className="font-display text-base font-bold text-tce-dark dark:text-white mb-4">{title}</h2>
      {children}
    </div>
  )

  const Row = ({ label, sub, action }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium text-tce-dark dark:text-white text-sm">{label}</div>
        {sub && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</div>}
      </div>
      {action}
    </div>
  )

  return (
    <div className="max-w-xl space-y-5 md:space-y-6 mt-4">
      <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">Admin Profile & Settings</h1>

      {/* Profile */}
      <Section title="Admin Profile">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-tce-dark/[0.06] dark:border-gray-700/50">
          <div className="w-14 h-14 rounded-full bg-tce-dark flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-tce-dark dark:text-white truncate">{user?.name || 'Administrator'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
            <div className="text-xs text-tce-green mt-0.5">{user?.role || 'Admin'} · {user?.dept || 'TCE'}</div>
          </div>
        </div>
        {[['Name', user?.name || 'Administrator'], ['Email', user?.email], ['Role', user?.role || 'Admin'], ['Department', user?.dept || 'TCE']]
          .map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5 text-sm border-b border-tce-dark/[0.04] dark:border-gray-700/30 last:border-0">
              <span className="text-gray-500 dark:text-gray-400">{k}</span>
              <span className="font-medium text-tce-dark dark:text-white">{v}</span>
            </div>
          ))}
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Row
          label="Dark Mode"
          sub="Switch between light and dark themes"
          action={
            <button onClick={toggle} aria-label="Toggle dark mode"
              className="relative flex items-center justify-between w-14 h-7 rounded-full px-1 border-0 cursor-pointer transition-colors duration-300"
              style={{ background: dark ? '#2e6b52' : '#d1d5db' }}>
              <Sun className="w-3.5 h-3.5 text-amber-500 z-10 select-none" />
              <Moon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-200 z-10 select-none" />
              <span className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform duration-300"
                style={{ transform: dark ? 'translateX(28px)' : 'translateX(1px)' }} />
            </button>
          }
        />
      </Section>

      {/* Security */}
      <Section title="Security">
        <Row
          label="Reset Password"
          sub="Send reset link to your email"
          action={
            <button className="btn-outline text-sm shrink-0" onClick={handleReset} disabled={resetting}>
              {resetting ? 'Sending…' : 'Send Reset'}
            </button>
          }
        />
      </Section>

      {/* Advanced Data Export */}
      <ComplaintExportSection complaints={complaints} />
    </div>
  )
}
