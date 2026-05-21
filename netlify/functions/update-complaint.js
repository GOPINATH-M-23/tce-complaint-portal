/**
 * Netlify Function: update-complaint
 * PUT /.netlify/functions/update-complaint
 * (proxied as PUT /api/update-complaint)
 *
 * Purpose:
 *   Admin-only endpoint to update complaint status, priority, and reply.
 *   Automatically creates a student notification after update.
 *   Validates all inputs server-side.
 *
 * Request body:
 *   { complaintId, status?, priority?, adminReply?, read? }
 *   Authorization: Bearer <firebase-admin-token>
 */

import { requireAdmin }                     from './_middleware/auth.js'
import { validateComplaintUpdate }          from './_validators/complaint.js'
import { initAdmin }                        from './_utils/firebaseAdmin.js'
import { preflight, ok, badRequest, serverError, forbidden } from './_utils/response.js'
import { logger }                           from './_utils/logger.js'
import { FieldValue }                       from 'firebase-admin/firestore'

export const handler = async (event, context) => {
  const origin = event.headers?.origin || ''
  const start  = Date.now()

  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'POST') {
    return badRequest('Method not allowed.', origin)
  }

  logger.request(event, context)

  try {
    // ── 1. Admin-only ────────────────────────────────────────────────────────
    await requireAdmin(event, origin)

    // ── 2. Parse & validate ──────────────────────────────────────────────────
    let body = {}
    try { body = JSON.parse(event.body || '{}') } catch {
      return badRequest('Invalid JSON body.', origin)
    }

    const complaintId = String(body.complaintId || '').trim()
    if (!complaintId) return badRequest('complaintId is required.', origin)

    const validation = validateComplaintUpdate(body)
    if (!validation.valid) return badRequest(validation.error, origin)

    const updates = validation.data

    // ── 3. Load complaint ────────────────────────────────────────────────────
    const { db } = initAdmin()
    const compSnap = await db.collection('complaints').doc(complaintId).get()
    if (!compSnap.exists) return badRequest('Complaint not found.', origin)

    const complaint = compSnap.data()

    // ── 4. Write update + notification in a batch ────────────────────────────
    const batch = db.batch()

    batch.update(db.collection('complaints').doc(complaintId), {
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Build notification message
    const hasReply  = !!(updates.adminReply?.trim())
    const hasStatus = !!updates.status

    let type    = null
    let message = null

    if (hasReply && hasStatus) {
      type    = 'reply_and_status'
      message = `Admin replied to "${complaint.title}" and updated status to ${updates.status}.`
    } else if (hasReply) {
      type    = 'reply'
      message = `Admin replied to your complaint: "${complaint.title}"`
    } else if (hasStatus) {
      type    = 'status_update'
      message = `Your complaint "${complaint.title}" status changed to ${updates.status}.`
    }

    if (type && message) {
      const notifRef = db.collection('notifications').doc()
      batch.set(notifRef, {
        userId:         complaint.studentId,
        role:           'student',
        type,
        message,
        complaintId,
        complaintTitle: complaint.title,
        status:         updates.status || complaint.status,
        adminReply:     updates.adminReply || '',
        read:           false,
        createdAt:      FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()

    logger.info('Complaint updated', {
      complaintId,
      updates: Object.keys(updates),
      notified: !!type,
      durationMs: Date.now() - start,
    })

    return ok({ complaintId, updated: Object.keys(updates) }, origin)

  } catch (err) {
    if (err.statusCode) return err
    logger.error('update-complaint error', { error: err.message, durationMs: Date.now() - start })
    return serverError(origin)
  }
}
