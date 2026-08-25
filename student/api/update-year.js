import crypto from 'crypto'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.tce\.edu$/i
const OTP_REGEX = /^\d{6}$/
const OTP_SECRET = process.env.OTP_SECRET || process.env.VITE_FIREBASE_API_KEY || 'TCE_SECRET_KEY_OTP_2026'

let db = null

function initAdmin() {
  if (db) return db

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing Firebase Admin credentials. Cannot securely update Year.')
  }

  const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

  const app = getApps().length === 0
    ? initializeApp({ credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey }) })
    : getApps()[0]

  db = getFirestore(app)
  db.settings({ ignoreUndefinedProperties: true })
  return db
}

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
    const newYear   = Number(body?.newYear)

    if (!email || !STUDENT_EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please use your official @student.tce.edu email address.' })
    }

    if (!otp || !OTP_REGEX.test(otp)) {
      return res.status(400).json({ error: 'Invalid verification code.' })
    }

    if (!challenge || !expiresAt) {
      return res.status(400).json({ error: 'Invalid verification code.' })
    }

    if (!newYear || newYear < 1 || newYear > 5) {
      return res.status(400).json({ error: 'Invalid year selected.' })
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

    // Initialize Admin SDK and find user by email
    const firestore = initAdmin()
    
    // Get student by email
    const studentsRef = firestore.collection('students')
    const snapshot = await studentsRef.where('email', '==', email).limit(1).get()
    
    if (snapshot.empty) {
       return res.status(404).json({ error: 'Student account not found.' })
    }
    
    const studentDoc = snapshot.docs[0]
    
    // Securely update the Year directly from the backend
    await studentDoc.ref.update({
      year: newYear,
      updatedAt: new Date()
    })

    return res.status(200).json({
      success: true,
      message: 'Year updated successfully.',
    })
  } catch (err) {
    console.error('[update-year error]', err)
    return res.status(500).json({ error: err.message || 'Failed to update year.' })
  }
}
