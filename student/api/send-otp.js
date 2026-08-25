import crypto from 'crypto'
import nodemailer from 'nodemailer'

const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.tce\.edu$/i
const OTP_SECRET = process.env.OTP_SECRET || process.env.VITE_FIREBASE_API_KEY || 'TCE_SECRET_KEY_OTP_2026'

function wrapResponse(res) {
  if (typeof res.status !== 'function') {
    res.status = (code) => {
      res.statusCode = code
      return res
    }
  }
  if (typeof res.json !== 'function') {
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
      return res
    }
  }
}

async function getRequestBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body) } catch { return {} }
    }
    return req.body
  }
  return new Promise((resolve) => {
    let bodyStr = ''
    req.on('data', (chunk) => { bodyStr += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(bodyStr || '{}')) } catch { resolve({}) }
    })
  })
}

export default async function handler(req, res) {
  wrapResponse(res)
  
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = await getRequestBody(req)
    const email = (body?.email || '').trim().toLowerCase()

    if (!email || !STUDENT_EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please use your official @student.tce.edu email address.' })
    }

    // Generate secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    const now = Date.now()
    const expiresAt = now + 10 * 60 * 1000 // 10 minutes

    // Create HMAC signed challenge
    const payload = `${email}:${otp}:${expiresAt}`
    const challenge = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex')

    // Email Delivery via Nodemailer if SMTP vars exist
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST
    const smtpPort = process.env.SMTP_PORT || process.env.EMAIL_PORT || 587
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS
    const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"TCE Smart Complaint Portal" <no-reply@tce.edu>'

    if (!smtpUser || !smtpPass) {
      throw new Error('Email delivery is not configured. Please add SMTP_USER and SMTP_PASS to your environment variables.')
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost || 'smtp.gmail.com',
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: `Your Verification Code: ${otp} — TCE Student Portal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #064e3b; text-align: center; margin-bottom: 8px;">TCE Smart Complaint Portal</h2>
          <p style="color: #4b5563; font-size: 14px; text-align: center; margin-bottom: 24px;">Thiagarajar College of Engineering, Madurai</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 24px;" />
          <p style="color: #1f2937; font-size: 15px;">Hello,</p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Your 6-digit email verification code for TCE Smart Complaint Portal is:</p>
          <div style="background-color: #f0fdf4; border: 2px dashed #059669; border-radius: 10px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #065f46;">${otp}</span>
          </div>
          <p style="color: #dc2626; font-size: 13px; font-weight: 600; text-align: center;">This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">If you did not request this verification code, please ignore this email.</p>
        </div>
      `,
    })

    return res.status(200).json({
      success: true,
      challenge,
      expiresAt,
      message: 'Verification code sent to your email.',
    })
  } catch (err) {
    console.error('[send-otp error]', err)
    return res.status(500).json({ error: err.message || 'Failed to send verification code.' })
  }
}
