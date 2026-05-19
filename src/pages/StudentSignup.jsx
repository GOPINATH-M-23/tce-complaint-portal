import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentSignup, studentGoogleLogin } from '@/firebase/auth'
import { useAuth } from '@/context/AuthContext'
import { DEPARTMENTS } from '@/utils/constants'
import toast from 'react-hot-toast'
import tceLogo from '@/assets/tce-logo.png'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const PHONE_RE = /^[6-9]\d{9}$/
const REGNO_RE = /^[0-9]{16}$/   // e.g. 2403917720521023

export default function StudentSignup() {
  const { setUser } = useAuth()
  const navigate    = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', dept: 'CSE', year: 1,
    phone: '', regNo: '',
    password: '', confirmPassword: '',
  })
  const [showPw,        setShowPw]        = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors,        setErrors]        = useState({})

  // Google signup collects extra fields via a mini-modal
  const [googleStep,    setGoogleStep]    = useState(false)
  const [googleExtra,   setGoogleExtra]   = useState({ dept: 'CSE', year: 1, phone: '', regNo: '' })
  const [googleExtraErr, setGoogleExtraErr] = useState({})

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })) }
  const setExtra = (k, v) => { setGoogleExtra((f) => ({ ...f, [k]: v })); setGoogleExtraErr((e) => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!form.email.toLowerCase().endsWith('@student.tce.edu'))
      e.email = 'Must be a @student.tce.edu email'
    if (!form.phone.trim())              e.phone = 'Phone number is required'
    else if (!PHONE_RE.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number'
    if (!form.regNo.trim())              e.regNo = 'Registration number is required'
    else if (!REGNO_RE.test(form.regNo)) e.regNo = 'Format: 2403917720521023'
    if (form.password.length < 6)        e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateExtra = () => {
    const e = {}
    if (!googleExtra.phone.trim())              e.phone = 'Phone number is required'
    else if (!PHONE_RE.test(googleExtra.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number'
    if (!googleExtra.regNo.trim())              e.regNo = 'Registration number is required'
    else if (!REGNO_RE.test(googleExtra.regNo)) e.regNo = 'Format: 2403917720521023'
    setGoogleExtraErr(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const userData = await studentSignup({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        dept:     form.dept,
        year:     Number(form.year),
        phone:    form.phone.trim(),
        regNo:    form.regNo.trim().toUpperCase(),
        password: form.password,
      })
      setUser(userData)
      toast.success(`Welcome, ${userData.name}! Account created.`)
      navigate('/student')
    } catch (err) {
      setErrors({ form: err.message || 'Signup failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleStart = () => { setGoogleStep(true) }

  const handleGoogleFinish = async () => {
    if (!validateExtra()) return
    setGoogleLoading(true)
    setGoogleStep(false)
    try {
      const userData = await studentGoogleLogin(googleExtra)
      setUser(userData)
      toast.success(`Welcome, ${userData.name}!`)
      navigate('/student')
    } catch (err) {
      setErrors({ form: err.message || 'Google sign-up failed.' })
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tce-cream dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-2xl shadow-xl p-7 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4">
              <img src={tceLogo} alt="TCE"
                className="w-full h-full object-contain rounded-full border-2 border-tce-dark/20 dark:border-tce-green/30" />
            </div>
            <h1 className="font-display text-2xl font-bold text-tce-dark dark:text-white">Create Account</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">
              Register with your @student.tce.edu email
            </p>
          </div>

          {/* Google signup button */}
          <button type="button" onClick={handleGoogleStart}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border-[1.5px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-60 mb-5">
            {googleLoading
              ? <span className="w-4 h-4 border-2 border-gray-300 border-t-tce-green rounded-full animate-spin" />
              : <GoogleIcon />
            }
            {googleLoading ? 'Setting up…' : 'Sign up with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">or create with email</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errors.form && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl">
                {errors.form}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="Your full name"
                value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus required />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">College Email</label>
              <input type="email" className="form-input" placeholder="yourID@student.tce.edu"
                value={form.email} onChange={(e) => set('email', e.target.value)} required />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone + Reg No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" placeholder="10-digit mobile number"
                  value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} required />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="form-label">Registration Number</label>
                <input type="text" className="form-input" placeholder="e.g. 2403917720521023"
                  value={form.regNo} onChange={(e) => set('regNo', e.target.value.toUpperCase())} required />
                {errors.regNo && <p className="text-red-500 text-xs mt-1">{errors.regNo}</p>}
              </div>
            </div>

            {/* Dept + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Department</label>
                <select className="form-input" value={form.dept} onChange={(e) => set('dept', e.target.value)}>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Year</label>
                <select className="form-input" value={form.year} onChange={(e) => set('year', Number(e.target.value))}>
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="form-input pr-10"
                  placeholder="Minimum 6 characters"
                  value={form.password} onChange={(e) => set('password', e.target.value)} required />
                <button type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent border-0 cursor-pointer">
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-input" placeholder="Re-enter your password"
                value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading || googleLoading}
              className="btn-primary w-full py-3 text-sm font-semibold mt-1 disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button onClick={() => navigate('/login/student')}
                className="text-tce-green font-medium hover:underline bg-transparent border-0 cursor-pointer">
                Sign in
              </button>
            </p>
            <button onClick={() => navigate('/')}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-tce-dark dark:hover:text-gray-300 bg-transparent border-0 cursor-pointer">
              ← Back to home
            </button>
          </div>
        </div>
      </div>

      {/* Google extra info modal */}
      {googleStep && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-transparent dark:border-gray-700/50">
            <h2 className="font-display text-lg font-bold text-tce-dark dark:text-white mb-1">
              Complete Your Profile
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              A few more details to set up your account.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" placeholder="10-digit mobile number"
                  value={googleExtra.phone}
                  onChange={(e) => setExtra('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                {googleExtraErr.phone && <p className="text-red-500 text-xs mt-1">{googleExtraErr.phone}</p>}
              </div>
              <div>
                <label className="form-label">Registration Number</label>
                <input type="text" className="form-input" placeholder="e.g. 2403917720521023"
                  value={googleExtra.regNo}
                  onChange={(e) => setExtra('regNo', e.target.value.toUpperCase())} />
                {googleExtraErr.regNo && <p className="text-red-500 text-xs mt-1">{googleExtraErr.regNo}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Department</label>
                  <select className="form-input" value={googleExtra.dept}
                    onChange={(e) => setExtra('dept', e.target.value)}>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <select className="form-input" value={googleExtra.year}
                    onChange={(e) => setExtra('year', Number(e.target.value))}>
                    {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-1">
                <button className="btn-ghost" onClick={() => setGoogleStep(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleGoogleFinish}>Continue with Google</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
