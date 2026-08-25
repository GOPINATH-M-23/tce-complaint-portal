import crypto from 'crypto'

const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.tce\.edu$/i
const OTP_REGEX = /^\d{6}$/
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
    const email     = (body?.email || '').trim().toLowerCase()
    const otp       = (body?.otp   || '').trim()
    const challenge = (body?.challenge || '').trim()
    const expiresAt = Number(body?.expiresAt || 0)

    if (!email || !STUDENT_EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please use your official @student.tce.edu email address.' })
    }

    if (!otp || !OTP_REGEX.test(otp)) {
      return res.status(400).json({ error: 'Invalid verification code.' })
    }

    if (!challenge || !expiresAt) {
      return res.status(400).json({ error: 'Invalid verification code.' })
    }

    // Check expiration (10 minutes)
    if (Date.now() > expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' })
    }

    // Validate HMAC signature challenge
    const payload = `${email}:${otp}:${expiresAt}`
    const expectedChallenge = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex')

    if (challenge !== expectedChallenge) {
      return res.status(400).json({ error: 'Invalid verification code.' })
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    })
  } catch (err) {
    console.error('[verify-otp error]', err)
    return res.status(500).json({ error: err.message || 'Verification failed.' })
  }
}
