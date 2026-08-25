import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, resetPassword, sendStudentOtp, updateStudentYear, fetchUserProfile } from '@/firebase/auth'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintContext'
import toast from 'react-hot-toast'
import { Pencil, X, Check } from 'lucide-react'

export default function StudentProfile() {
  const { user, setUser } = useAuth()
  const { complaints } = useComplaints()
  const navigate = useNavigate()

  const [isEditingYear, setIsEditingYear] = useState(false)
  const [newYear, setNewYear] = useState(user?.year || 1)
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpChallenge, setOtpChallenge] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (err) {
      toast.error('Logout failed. Please try again.')
    }
  }

  const handleSendYearOtp = async () => {
    if (newYear === user?.year) {
      setIsEditingYear(false)
      return
    }
    setLoading(true)
    try {
      const res = await sendStudentOtp(user.email)
      setOtpChallenge({ challenge: res.challenge, expiresAt: res.expiresAt })
      setOtpStep(true)
      toast.success(res.message || 'OTP sent to your email.')
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyYearOtp = async () => {
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP')
    setLoading(true)
    try {
      await updateStudentYear(user.email, otp, otpChallenge.challenge, otpChallenge.expiresAt, newYear)
      toast.success('Year updated successfully!')
      setOtpStep(false)
      setIsEditingYear(false)
      setOtp('')
      setOtpChallenge(null)
      // Refresh user profile
      const updatedUser = await fetchUserProfile(user.uid)
      if (updatedUser) setUser(updatedUser)
    } catch (err) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const cancelYearEdit = () => {
    setIsEditingYear(false)
    setOtpStep(false)
    setNewYear(user?.year || 1)
    setOtp('')
    setOtpChallenge(null)
  }

  const fields = [
    ['Full Name', user?.name],
    ['Student ID', user?.studentId],
    ['Registration Number', user?.regNo || '—'],
    ['Roll Number', user?.rollNo || '—'],
    ['Phone Number', user?.phone || '—'],
    ['Email', user?.email],
    ['Department', user?.dept],
    ['Year', `${user?.year}`],
    ['Status', 'Active'],
  ]

  return (
    <div className="max-w-xl space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">My Profile</h1>
      </div>

      {/* Avatar card */}
      <div className="card flex items-center gap-4 md:gap-5">
        {user?.photoURL ? (
          <img src={user.photoURL} alt={user.name}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-tce-green/30 shrink-0" />
        ) : (
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-tce-dark dark:bg-tce-green flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.name?.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-display text-lg md:text-xl font-bold text-tce-dark dark:text-white truncate">
            {user?.name}
          </div>
          <div className="text-tce-green dark:text-tce-green/80 text-sm truncate">
            {user?.studentId} · {user?.dept}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{user?.email}</div>
        </div>
      </div>

      {/* Detail rows */}
      <div className="card divide-y divide-tce-dark/[0.06] dark:divide-gray-700/50">
        {fields.map(([k, v]) => (
          <div key={k} className="flex justify-between items-center py-3 text-sm gap-2">
            <span className="text-gray-500 dark:text-gray-400 shrink-0">{k}</span>
            {k === 'Year' ? (
              <div className="flex items-center gap-2">
                {isEditingYear ? (
                  otpStep ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit OTP"
                        className="input-field py-1 px-2 w-24 text-center text-sm"
                        disabled={loading}
                      />
                      <button onClick={handleVerifyYearOtp} disabled={loading || otp.length !== 6} className="p-1.5 text-tce-green hover:bg-tce-green/10 rounded-md">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelYearEdit} disabled={loading} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={newYear}
                        onChange={(e) => setNewYear(Number(e.target.value))}
                        className="input-field py-1 px-2 w-20 text-sm"
                        disabled={loading}
                      >
                        {[1, 2, 3, 4, 5].map((y) => (
                          <option key={y} value={y}>Year {y}</option>
                        ))}
                      </select>
                      <button onClick={handleSendYearOtp} disabled={loading} className="btn-primary py-1 px-3 text-xs h-auto min-h-0">
                        {loading ? '...' : 'Save'}
                      </button>
                      <button onClick={cancelYearEdit} disabled={loading} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    <span className="font-medium text-tce-dark dark:text-white text-right truncate">{v}</span>
                    <button onClick={() => { setIsEditingYear(true); setNewYear(user?.year || 1) }} className="p-1 text-gray-400 hover:text-tce-green">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <span className="font-medium text-tce-dark dark:text-white text-right truncate max-w-[60%]">{v}</span>
            )}
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Total', v: complaints.length },
          { l: 'Resolved', v: complaints.filter((c) => c.status === 'Resolved').length },
          { l: 'Pending', v: complaints.filter((c) => !['Resolved', 'Rejected'].includes(c.status)).length },
        ].map((s) => (
          <div key={s.l} className="card text-center py-4">
            <div className="font-display text-2xl font-bold text-tce-dark dark:text-white">{s.v}</div>
            <div className="text-xs text-tce-muted dark:text-gray-400 mt-1">{s.l}</div>
          </div>
        ))}
      </div>
      {/* Security Section */}
      <div className="card space-y-3">
        <h2 className="font-display text-base font-bold text-tce-dark dark:text-white">Security & Password</h2>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium text-tce-dark dark:text-white text-sm">Reset Account Password</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Send a secure password reset link to {user?.email}</div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await resetPassword(user.email)
                toast.success('Password reset link sent. Check your email.')
              } catch (err) {
                toast.error(err.message || 'Failed to send password reset link.')
              }
            }}
            className="btn-outline text-xs px-3.5 py-2 font-medium shrink-0"
          >
            Send Reset Link
          </button>
        </div>
      </div>
      {/* Mobile-only Logout Section */}
      <div className="pt-2 md:hidden">
        <button
          onClick={handleLogout}
          className="btn-outline w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        To update your profile details, please contact the college admin.
      </p>
    </div>
  )
}
