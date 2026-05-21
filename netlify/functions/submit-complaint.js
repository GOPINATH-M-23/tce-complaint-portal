/**
 * Netlify Function: submit-complaint
 * POST /.netlify/functions/submit-complaint
 * (proxied as POST /api/submit-complaint)
 *
 * Purpose:
 *   Server-side complaint submission with full validation, spam protection,
 *   and auto-priority calculation. This replaces the direct Firestore write
 *   from the client, ensuring all business logic runs in a trusted environment.
 *
 * Why server-side submission?
 *   - Client can't manipulate priority, status, or studentId fields
 *   - Server validates category against the official enum
 *   - Rate limiting prevents complaint spam
 *   - Business logic (auto-priority) is consistent and tamper-proof
 *
 * Request body:
 *   { title, category, description }
 *   Authorization: Bearer <firebase-id-token>
 *
 * Response:
 *   { success: true, data: { complaintId } }
 */

import { requireAuth }                        from './_middleware/auth.js'
import { rateLimiter, getClientIp, LIMITS }   from './_middleware/rateLimit.js'
import { validateComplaintSubmit }            from './_validators/complaint.js'
import { initAdmin }                          from './_utils/firebaseAdmin.js'
import { preflight, created, badRequest, serverError, tooManyRequests } from './_utils/response.js'
import { logger }                             from './_utils/logger.js'
import { FieldValue }                         from 'firebase-admin/firestore'

const PRIORITY_THRESHOLDS = { CRITICAL: 8, HIGH: 4, MEDIUM: 2 }

const calculatePriority = async (db, category) => {
  // Use count() aggregation — reads only 1 document equivalent, not all docs
  const snap = await db.collection('complaints')
    .where('category', '==', category)
    .count()
    .get()
  const count = snap.data().count

  if (count >= PRIORITY_THRESHOLDS.CRITICAL) return 'Critical'
  if (count >= PRIORITY_THRESHOLDS.HIGH)     return 'High'
  if (count >= PRIORITY_THRESHOLDS.MEDIUM)   return 'Medium'
  return 'Low'
}

export const handler = async (event, context) => {
  const origin = event.headers?.origin || ''
  const start  = Date.now()

  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  if (event.httpMethod !== 'POST')    return badRequest('Method not allowed.', origin)

  logger.request(event, context)

  try {
    // ── 1. Authenticate ──────────────────────────────────────────────────────
    const user = await requireAuth(event, origin)

    if (user.role !== 'student') {
      return badRequest('Only students can submit complaints.', origin)
    }

    // ── 2. Rate limit — per IP ───────────────────────────────────────────────
    const ip    = getClientIp(event)
    const limit = rateLimiter.check(ip, 'complaint', LIMITS.complaint)
    if (!limit.allowed) return tooManyRequests(limit.retryAfter, origin)

    // ── 3. Parse & validate body ─────────────────────────────────────────────
    let body = {}
    try {
      body = JSON.parse(event.body || '{}')
    } catch {
      return badRequest('Invalid JSON body.', origin)
    }

    const validation = validateComplaintSubmit(body)
    if (!validation.valid) return badRequest(validation.error, origin)

    const { title, category, description } = validation.data

    // ── 4. Business logic: calculate priority ────────────────────────────────
    const { db } = initAdmin()
    const priority = await calculatePriority(db, category)

    // ── 5. Write to Firestore ────────────────────────────────────────────────
    const batch = db.batch()

    const complaintRef = db.collection('complaints').doc()
    batch.set(complaintRef, {
      title,
      category,
      description,
      status:       'Submitted',
      priority,
      studentId:    user.studentId,
      studentName:  user.name,
      studentEmail: user.email,
      dept:         user.dept || '',
      adminReply:   '',
      imageUrl:     '',
      imagePublicId:'',
      read:         false,
      createdAt:    FieldValue.serverTimestamp(),
      updatedAt:    FieldValue.serverTimestamp(),
    })

    // Create submission notification in the same batch
    const notifRef = db.collection('notifications').doc()
    batch.set(notifRef, {
      userId:         user.studentId,
      role:           'student',
      type:           'submitted',
      message:        `Your complaint "${title}" has been submitted successfully.`,
      complaintId:    complaintRef.id,
      complaintTitle: title,
      status:         'Submitted',
      adminReply:     '',
      read:           false,
      createdAt:      FieldValue.serverTimestamp(),
    })

    await batch.commit()

    logger.info('Complaint submitted', {
      complaintId: complaintRef.id,
      uid:         user.uid,
      category,
      priority,
      durationMs:  Date.now() - start,
    })

    return created({ complaintId: complaintRef.id }, origin)

  } catch (err) {
    if (err.statusCode) return err
    logger.error('submit-complaint error', { error: err.message, durationMs: Date.now() - start })
    return serverError(origin)
  }
}
