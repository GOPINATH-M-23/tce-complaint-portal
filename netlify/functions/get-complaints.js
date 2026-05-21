/**
 * Netlify Function: get-complaints
 * GET /.netlify/functions/get-complaints
 * (proxied as GET /api/get-complaints)
 *
 * Purpose:
 *   Paginated complaint fetching with cursor-based pagination.
 *   Students get only their own complaints; admins get all.
 *
 * Why pagination?
 *   Fetching all complaints at once is fine at 50 documents. At 5,000 it costs
 *   5,000 Firestore reads per page load and causes UI jank. Cursor-based
 *   pagination fetches a fixed page size and uses the last document as the
 *   cursor for the next page.
 *
 * Query params:
 *   ?limit=20        - documents per page (default 20, max 50)
 *   ?cursor=<docId>  - last document ID from previous page (for next page)
 *   ?category=Water  - filter by category
 *   ?status=Submitted - filter by status
 *
 * Response:
 *   { complaints: [...], nextCursor: string|null, hasMore: boolean }
 *
 * Note: Real-time subscriptions (onSnapshot) should be used in the dashboard
 * for the first load. This endpoint is for paginated archive views.
 */

import { requireAuth }  from './_middleware/auth.js'
import { initAdmin }    from './_utils/firebaseAdmin.js'
import { preflight, ok, badRequest, serverError } from './_utils/response.js'
import { logger }       from './_utils/logger.js'

const MAX_LIMIT     = 50
const DEFAULT_LIMIT = 20

export const handler = async (event, context) => {
  const origin = event.headers?.origin || ''
  const start  = Date.now()

  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  if (event.httpMethod !== 'GET')     return badRequest('Method not allowed.', origin)

  logger.request(event, context)

  try {
    // ── 1. Authenticate ──────────────────────────────────────────────────────
    const user = await requireAuth(event, origin)

    // ── 2. Parse query params ────────────────────────────────────────────────
    const params   = event.queryStringParameters || {}
    const limit    = Math.min(parseInt(params.limit || DEFAULT_LIMIT, 10), MAX_LIMIT)
    const cursor   = params.cursor || null
    const category = params.category || null
    const status   = params.status   || null

    // ── 3. Build Firestore query ─────────────────────────────────────────────
    const { db } = initAdmin()
    let q = db.collection('complaints').orderBy('createdAt', 'desc')

    // Students only see their own complaints
    if (user.role === 'student') {
      q = q.where('studentId', '==', user.studentId)
    }

    // Optional filters
    if (category) q = q.where('category', '==', category)
    if (status)   q = q.where('status',   '==', status)

    // Cursor-based pagination
    if (cursor) {
      const cursorSnap = await db.collection('complaints').doc(cursor).get()
      if (cursorSnap.exists) q = q.startAfter(cursorSnap)
    }

    // Fetch one extra to determine hasMore
    q = q.limit(limit + 1)

    // ── 4. Execute & format ──────────────────────────────────────────────────
    const snap       = await q.get()
    const docs       = snap.docs
    const hasMore    = docs.length > limit
    const page       = docs.slice(0, limit)
    const nextCursor = hasMore ? page[page.length - 1].id : null

    const complaints = page.map((d) => {
      const data = d.data()
      return {
        id:           d.id,
        title:        data.title,
        category:     data.category,
        status:       data.status,
        priority:     data.priority,
        studentId:    data.studentId,
        studentName:  data.studentName,
        adminReply:   data.adminReply || '',
        imageUrl:     data.imageUrl   || '',
        read:         data.read,
        createdAt:    data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt:    data.updatedAt?.toDate?.()?.toISOString() || null,
      }
    })

    logger.info('Complaints fetched', {
      uid:        user.uid,
      role:       user.role,
      count:      complaints.length,
      hasMore,
      durationMs: Date.now() - start,
    })

    return ok({ complaints, nextCursor, hasMore }, origin)

  } catch (err) {
    if (err.statusCode) return err
    logger.error('get-complaints error', { error: err.message, durationMs: Date.now() - start })
    return serverError(origin)
  }
}
