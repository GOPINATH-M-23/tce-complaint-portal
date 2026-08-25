import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, adminGoogleLogin, resetPassword } from '@/firebase/auth'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import tceLogo from '@/assets/tce-logo.png'
import { Eye, EyeOff, ArrowLeft, Key, X, AlertTriangle, Check } from 'lucide-react'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function LoginForm() {
  const { setUser } = useAuth()
  const navigate    = useNavigate()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error,       setError]       = useState('')

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userData = await adminLogin(email, password)
      setUser(userData)
      toast.success(`Welcome back, ${userData.name || 'Admin'}!`)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const userData = await adminGoogleLogin()
      setUser(userData)
      toast.success(`Welcome back, ${userData.name || 'Admin'}!`)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Google sign-in failed.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const openForgotModal = () => {
    setResetEmail(email.trim())
    setResetError('')
    setResetSuccess('')
    setShowForgotModal(true)
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setResetError('')
    setResetSuccess('')
    setResetLoading(true)

    try {
      await resetPassword(resetEmail)
      const successMsg = 'Password reset link sent. Please check your email, including your spam or junk folder.'
      setResetSuccess(successMsg)
      toast.success(successMsg)
    } catch (err) {
      setResetError(err.message || 'Failed to send password reset email.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tce-cream dark:bg-gray-950 px-4 py-6 md:py-10">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700/50 rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center rounded-full border-2 border-tce-dark/20 dark:border-tce-green/30 overflow-hidden shrink-0 bg-tce-cream dark:bg-gray-800">
              <img src={tceLogo} alt="TCE"
                className="w-full h-full object-cover" />
            </div>
            <h1 className="font-display text-2xl font-bold text-tce-dark dark:text-white">
              Admin Login
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">
              Sign in to the admin panel
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border-[1.5px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-gray-300 border-t-tce-green rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input"
                placeholder="admin@tce.edu"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label mb-0">Password</label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-xs text-tce-green hover:underline font-medium bg-transparent border-0 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="form-input pr-10"
                  placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent border-0 cursor-pointer p-1"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading || googleLoading}
              className="btn-primary w-full py-3 text-sm font-semibold mt-1 disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button onClick={() => navigate('/')}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-tce-dark dark:hover:text-gray-300 bg-transparent border-0 cursor-pointer flex items-center justify-center gap-1 mx-auto">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to home</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-0 cursor-pointer p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-3 bg-tce-green/10 text-tce-green rounded-full flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="font-display text-xl font-bold text-tce-dark dark:text-white">
                Reset Password
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your registered admin email address to receive a secure password reset link.
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="form-label">Admin Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your admin email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={resetLoading}
                />
              </div>

              {resetError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs px-3 py-2.5 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-2.5 rounded-xl flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-outline flex-1 py-2.5 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn-primary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {resetLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

