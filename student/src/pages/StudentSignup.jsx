import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentSignup, isValidStudentEmail, sendStudentOtp, verifyStudentOtp } from '@/firebase/auth'
import { DEPARTMENTS } from '@/utils/constants'
import toast from 'react-hot-toast'
import tceLogo from '@/assets/tce-logo.png'
import { ArrowLeft, Mail, AlertTriangle, Check, RefreshCw } from 'lucide-react'

const PHONE_RE = /^[6-9]\d{9}$/
const REGNO_RE = /^\d{16}$/
const ROLLNO_RE = /^[0-9]{6}$/
const OTP_RE    = /^\d{6}$/

export default function StudentSignup() {
  const navigate = useNavigate()

  // Form State
  const [form, setForm] = useState({
    name: '', email: '', dept: '', year: '',
    phone: '', regNo: '', rollNo: '',
    password: '', confirmPassword: '',
  })
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})

  // OTP Verification Step State
  const [step,          setStep]          = useState('form') // 'form' | 'otp'
  const [otp,           setOtp]           = useState('')
  const [otpChallenge,  setOtpChallenge]  = useState('')
  const [otpExpiresAt,  setOtpExpiresAt]  = useState(0)
  const [otpVerifying,  setOtpVerifying]  = useState(false)
  const [otpSending,    setOtpSending]    = useState(false)
  const [cooldown,      setCooldown]      = useState(0)
  const [otpError,      setOtpError]      = useState('')

  useEffect(() => {
    let timer
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((c) => (c > 0 ? c - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Full Name is required.'
    
    if (!form.email.trim()) e.email = 'College Email is required.'
    else if (!isValidStudentEmail(form.email.trim()))
      e.email = 'Please use your official @student.tce.edu email address.'

    if (!form.phone.trim())              e.phone = 'Phone Number is required.'
    else if (!PHONE_RE.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number.'

    if (!form.regNo.trim())              e.regNo = 'Registration Number is required.'
    else if (!REGNO_RE.test(form.regNo)) e.regNo = '16-digit registration number required.'

    if (!form.rollNo.trim())              e.rollNo = 'Roll Number is required.'
    else if (!ROLLNO_RE.test(form.rollNo)) e.rollNo = 'Roll Number must be exactly 6 digits.'

    if (!form.dept)                         e.dept = 'Department is required.'
    if (!form.year)                         e.year = 'Year is required.'

    if (!form.password)                  e.password = 'Password is required.'
    else if (form.password.length < 6)   e.password = 'Password must be at least 6 characters.'

    if (!form.confirmPassword)           e.confirmPassword = 'Confirm Password is required.'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Send OTP & transition to OTP step
  const handleFormSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      const resData = await sendStudentOtp(form.email.trim())
      setOtpChallenge(resData.challenge || '')
      setOtpExpiresAt(resData.expiresAt || 0)
      toast.success('Verification code sent to your email.')
      setStep('otp')
      setCooldown(30)
      setOtp('')
      setOtpError('')
    } catch (err) {
      setErrors({ form: err.message || 'Failed to send verification code. Please check your email address.' })
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendCode = async () => {
    if (cooldown > 0 || otpSending) return
    setOtpSending(true)
    setOtpError('')
    try {
      const resData = await sendStudentOtp(form.email.trim())
      setOtpChallenge(resData.challenge || '')
      setOtpExpiresAt(resData.expiresAt || 0)
      toast.success('Verification code sent to your email.')
      setCooldown(30)
    } catch (err) {
      setOtpError(err.message || 'Failed to resend verification code.')
    } finally {
      setOtpSending(false)
    }
  }

  // Verify OTP & ONLY THEN create Firebase Auth user and Firestore doc
  const handleVerifyAndCreateAccount = async (ev) => {
    ev.preventDefault()
    setOtpError('')

    if (!OTP_RE.test(otp.trim())) {
      setOtpError('Invalid verification code.')
      return
    }

    setOtpVerifying(true)
    try {
      // 1. Verify OTP first
      await verifyStudentOtp(form.email.trim(), otp.trim(), otpChallenge, otpExpiresAt)
      toast.success('Email verified successfully.')

      // 2. ONLY AFTER OTP VERIFICATION: Create Firebase Auth Account & Firestore Doc
      await studentSignup({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        dept:     form.dept,
        year:     Number(form.year),
        phone:    form.phone.trim(),
        regNo:    form.regNo.trim().toUpperCase(),
        rollNo:   form.rollNo.trim(),
        password: form.password,
      })

      toast.success('Account created successfully! Please log in.', { duration: 5000 })
      navigate('/login')
    } catch (err) {
      setOtpError(err.message || 'Invalid verification code.')
    } finally {
      setOtpVerifying(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tce-cream dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-2xl shadow-xl p-7 md:p-8">
          
          {step === 'form' ? (
            <>
              {/* Form Header */}
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

              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                {errors.form && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{errors.form}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" placeholder="Your full name"
                    value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus required />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">College Email *</label>
                  <input type="email" className="form-input" placeholder="yourID@student.tce.edu"
                    value={form.email} onChange={(e) => set('email', e.target.value)} required />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input type="tel" className="form-input" placeholder="10-digit mobile number"
                    value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} required />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                {/* Reg No + Roll No */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Registration Number *</label>
                    <input type="text" className="form-input" placeholder="e.g. 2403917720521023"
                      value={form.regNo} onChange={(e) => set('regNo', e.target.value.toUpperCase())} required />
                    {errors.regNo && <p className="text-red-500 text-xs mt-1">{errors.regNo}</p>}
                  </div>
                  <div>
                    <label className="form-label">Roll Number *</label>
                    <input type="text" inputMode="numeric" maxLength={6} className="form-input" placeholder="e.g. 670710"
                      value={form.rollNo} onChange={(e) => set('rollNo', e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                    {errors.rollNo && <p className="text-red-500 text-xs mt-1">{errors.rollNo}</p>}
                  </div>
                </div>

                {/* Dept + Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Department *</label>
                    <select className="form-input" value={form.dept} onChange={(e) => set('dept', e.target.value)} required>
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {errors.dept && <p className="text-red-500 text-xs mt-1">{errors.dept}</p>}
                  </div>
                  <div>
                    <label className="form-label">Year *</label>
                    <select className="form-input" value={form.year} onChange={(e) => set('year', e.target.value)} required>
                      <option value="">Select Year</option>
                      {[1, 2, 3, 4].map((y) => (
                        <option key={y} value={y}>
                          Year {y}
                        </option>
                      ))}
                    </select>
                    {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="form-label">Password *</label>
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
                  <label className="form-label">Confirm Password *</label>
                  <input type="password" className="form-input" placeholder="Re-enter your password"
                    value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-3 text-sm font-semibold mt-1 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending verification code…</span>
                    </>
                  ) : (
                    <span>Continue to Email Verification</span>
                  )}
                </button>
              </form>

              {/* Links */}
              <div className="mt-5 text-center space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Already have an account?{' '}
                  <button onClick={() => navigate('/login')}
                    className="text-tce-green font-medium hover:underline bg-transparent border-0 cursor-pointer">
                    Sign in
                  </button>
                </p>
                <button onClick={() => navigate('/')}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-tce-dark dark:hover:text-gray-300 bg-transparent border-0 cursor-pointer flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to home</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* OTP Verification Step Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 bg-tce-green/10 text-tce-green rounded-full flex items-center justify-center">
                  <Mail className="w-7 h-7" />
                </div>
                <h1 className="font-display text-2xl font-bold text-tce-dark dark:text-white">Verify Your Email</h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1.5 leading-relaxed">
                  We sent a 6-digit verification code to: <br />
                  <strong className="text-tce-dark dark:text-gray-200 font-semibold">{form.email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyAndCreateAccount} className="flex flex-col gap-4">
                {otpError && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div>
                  <label className="form-label text-center block mb-2">Enter Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="form-input text-center text-2xl font-mono tracking-[0.5em] py-3 rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-1.5">
                    Enter the 6-digit numeric OTP sent to your inbox. Valid for 10 minutes.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpVerifying || otp.length !== 6}
                  className="btn-primary w-full py-3 text-sm font-semibold mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {otpVerifying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying code & creating account…</span>
                    </>
                  ) : (
                    <span>Verify Email & Create Account</span>
                  )}
                </button>
              </form>

              {/* Resend Code Section */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Didn't receive the code?{' '}
                  {cooldown > 0 ? (
                    <span className="text-tce-muted font-medium ml-1">
                      Resend available in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={otpSending}
                      className="text-tce-green font-semibold hover:underline bg-transparent border-0 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 ml-1"
                    >
                      {otpSending ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                      <span>Resend Code</span>
                    </button>
                  )}
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setOtpError(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent border-0 cursor-pointer inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change details / email</span>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

