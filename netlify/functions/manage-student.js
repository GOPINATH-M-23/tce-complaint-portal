/**
 * Netlify Function: manage-student
 * POST /.netlify/functions/manage-student
 * (proxied as POST /api/manage-student)
 *
 * Purpose:
 *   Admin-only endpoint for student account management:
 *   - action: "toggle"  → activate / deactivate a student
 *   - action: "create"  → create new student account (admin-provisioned)
 *
 * Why server-side?
 *   - Activating/deactivating requires Firebase Admin SDK (can't be done client-side)
 *   - Account creation should validate uniqueness before writing
 *   - All mutations on user records must be admin-authenticated
 *
 * Request body:
 *   { action: "toggle", studentUid: string, active: boolean }
 *   { action: "create", name, studentId, dept, year, phone?, regNo?, password }
 *   Authorization: Bearer <firebase-admin-token>
 */

import { requireAdmin }              from './_middleware/auth.js'
import { validateStudentData }       from './_validators/complaint.js'
import { initAdmin }                 from './_utils/firebaseAdmin.js'
import { preflight, ok, created, badRequest, serverError } from './_utils/response.js'
import { logger }                    from './_utils/logger.js'
import { FieldValue }                from 'firebase-admin/firestore'

export const handler = async (event, context) => {
  const origin = event.headers?.origin || ''
  const start  = Date.now()

  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  if (event.httpMethod !== 'POST')    return badRequest('Method not allowed.', origin)

  logger.request(event, context)

  try {
    // ── 1. Admin-only ────────────────────────────────────────────────────────
    const admin = await requireAdmin(event, origin)

    // ── 2. Parse body ────────────────────────────────────────────────────────
    let body = {}
    try { body = JSON.parse(event.body || '{}') } catch {
      return badRequest('Invalid JSON body.', origin)
    }

    const action = String(body.action || '').trim()

    // ── Action: toggle active status ─────────────────────────────────────────
    if (action === 'toggle') {
      const { studentUid, active } = body
      if (!studentUid) return badRequest('studentUid is required.', origin)
      if (typeof active !== 'boolean') return badRequest('active must be a boolean.', origin)

      const { db } = initAdmin()
      const snap = await db.collection('students').doc(studentUid).get()
      if (!snap.exists) return badRequest('Student not found.', origin)

      await db.collection('students').doc(studentUid).update({ active })

      logger.info('Student status toggled', {
        adminUid:   admin.uid,
        studentUid,
        active,
        durationMs: Date.now() - start,
      })

      return ok({ studentUid, active }, origin)
    }

    // ── Action: create new student account ───────────────────────────────────
    if (action === 'create') {
      const validation = validateStudentData(body)
      if (!validation.valid) return badRequest(validation.error, origin)

      const { name, studentId, dept, year, phone, regNo } = validation.data
      const password = String(body.password || 'TCE@123').trim()

      if (password.length < 6) {
        return badRequest('Password must be at least 6 characters.', origin)
      }

      const email = `${studentId.toLowerCase()}@student.tce.edu`
      const { auth, db } = initAdmin()

      // Check if email already exists
      try {
        await auth.getUserByEmail(email)
        return badRequest(`An account for ${email} already exists.`, origin)
      } catch (err) {
        if (err.code !== 'auth/user-not-found') throw err
        // Expected: user not found → proceed with creation
      }

      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      })

      // Write Firestore profile
      await db.collection('students').doc(userRecord.uid).set({
        uid:        userRecord.uid,
        name,
        email,
        studentId:  studentId.toLowerCase(),
        dept,
        year,
        phone:      phone || '',
        regNo:      regNo || '',
        photoURL:   '',
        active:     true,
        authMethod: 'email',
        createdAt:  FieldValue.serverTimestamp(),
        createdBy:  admin.uid,
      })

      logger.info('Student account created', {
        adminUid:   admin.uid,
        studentUid: userRecord.uid,
        studentId,
        durationMs: Date.now() - start,
      })

      return created({ uid: userRecord.uid, email }, origin)
    }

    return badRequest(`Unknown action: "${action}". Use "toggle" or "create".`, origin)

  } catch (err) {
    if (err.statusCode) return err
    logger.error('manage-student error', { error: err.message, durationMs: Date.now() - start })
    return serverError(origin)
  }
}
