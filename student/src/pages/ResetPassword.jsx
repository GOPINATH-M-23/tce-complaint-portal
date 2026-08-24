import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { friendlyAuthError } from '@/utils/authErrors'
import toast from 'react-hot-toast'
import tceLogo from '@/assets/tce-logo.png'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const oobCode = searchParams.get('oobCode') || searchParams.get('code') || ''
  const mode = searchParams.get('mode') || ''

  const [verifying, setVerifying] = useState(true)
  const [email, setEmail] = useState('')
  const [codeError, setCodeError] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!oobCode) {
      setCodeError('No password reset code found in URL. Please use the link sent to your email.')
      setVerifying(false)
      return
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail)
        setVerifying(false)
      })
      .catch((err) => {
        console.error('[verifyPasswordResetCode Error]', err)
        setCodeError(friendlyAuthError(err) || 'This password reset link is invalid or has expired.')
        setVerifying(false)
      })
  }, [oobCode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setFormError('New password and confirm password do not match.')
      return
    }

    setLoading(true)
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      setSuccess(true)
      toast.success('Password reset successfully!')
    } catch (err) {
      console.error('[confirmPasswordReset Error]', err)
      setFormError(friendlyAuthError(err) || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tce-cream dark:bg-gray-950 px-4 py-6 md:py-10">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700/50 rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center rounded-full border-2 border-tce-dark/20 dark:border-tce-green/30 overflow-hidden shrink-0 bg-tce-cream dark:bg-gray-800">
              <img src={tceLogo} alt="TCE" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-display text-2xl font-bold text-tce-dark dark:text-white">
              Set New Password
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">
              Choose a new password for your student account
            </p>
          </div>

          {verifying ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-tce-green border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Verifying reset link...</p>
            </div>
          ) : codeError ? (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-4 rounded-xl flex items-start gap-2.5">
                <span className="shrink-0 text-lg mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold text-sm">Invalid or Expired Link</p>
                  <p className="text-xs mt-1 leading-relaxed">{codeError}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full py-2.5 text-sm font-semibold"
              >
                Return to Student Login
              </button>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-xl font-bold">
                ✓
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-tce-dark dark:text-white">
                  Password Reset Complete!
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your password for <strong className="text-tce-dark dark:text-white">{email}</strong> has been updated.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full py-3 text-sm font-semibold mt-2"
              >
                Sign In With New Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {email && (
                <div className="p-3 bg-tce-cream dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Account Email</span>
                  <span className="font-semibold text-sm text-tce-dark dark:text-white truncate block">{email}</span>
                </div>
              )}

              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent border-0 cursor-pointer"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Confirm New Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {formError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs px-3 py-2.5 rounded-xl flex items-start gap-2">
                  <span className="shrink-0 text-red-500">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm font-semibold mt-2 disabled:opacity-60"
              >
                {loading ? 'Updating Password...' : 'Set New Password'}
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-tce-dark dark:hover:text-gray-300 bg-transparent border-0 cursor-pointer"
            >
              ← Back to Student Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
