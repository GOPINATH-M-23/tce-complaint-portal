/**
 * Input validators for complaint submission and updates.
 *
 * Why server-side validation?
 *   Client-side validation (React form) can be bypassed by anyone who knows
 *   the API endpoint. All inputs MUST be re-validated on the server before
 *   writing to Firestore.
 *
 * Design:
 *   Each validator returns { valid: true, data: sanitizedData }
 *   or { valid: false, error: 'message' }
 */

const CATEGORIES = [
  'Water Issues', 'Food Problems', 'Sanitary Issues', 'Bathroom Issues',
  'Hostel Problems', 'Staff Issues', 'Ragging', 'Student Safety',
  'WiFi Problems', 'Electrical Issues', 'Classroom Problems', 'Lab Problems',
  'Transport Problems', 'Library Problems', 'Medical Support', 'Mental Health',
  'Academic Issues', 'Other',
]

const STATUSES = [
  'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected',
]

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

/** Sanitize a string: trim whitespace, collapse multiple spaces */
const sanitizeStr = (val, maxLen = 500) =>
  String(val || '').trim().replace(/\s+/g, ' ').slice(0, maxLen)

/**
 * Validate a new complaint submission.
 * Called before writing to Firestore.
 */
export const validateComplaintSubmit = (body) => {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' }
  }

  const title       = sanitizeStr(body.title, 120)
  const category    = sanitizeStr(body.category, 60)
  const description = sanitizeStr(body.description, 2000)

  if (!title || title.length < 5) {
    return { valid: false, error: 'Title must be at least 5 characters.' }
  }
  if (!CATEGORIES.includes(category)) {
    return { valid: false, error: `Invalid category: "${category}".` }
  }
  if (!description || description.length < 20) {
    return { valid: false, error: 'Description must be at least 20 characters.' }
  }

  return {
    valid: true,
    data: { title, category, description },
  }
}

/**
 * Validate an admin complaint update.
 * Called before updating Firestore.
 */
export const validateComplaintUpdate = (body) => {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' }
  }

  const updates = {}

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return { valid: false, error: `Invalid status: "${body.status}".` }
    }
    updates.status = body.status
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      return { valid: false, error: `Invalid priority: "${body.priority}".` }
    }
    updates.priority = body.priority
  }

  if (body.adminReply !== undefined) {
    updates.adminReply = sanitizeStr(body.adminReply, 1000)
  }

  if (body.read !== undefined) {
    updates.read = Boolean(body.read)
  }

  if (Object.keys(updates).length === 0) {
    return { valid: false, error: 'No valid fields to update.' }
  }

  return { valid: true, data: updates }
}

/**
 * Validate student signup / account creation fields.
 */
export const validateStudentData = (body) => {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' }
  }

  const name      = sanitizeStr(body.name, 80)
  const studentId = sanitizeStr(body.studentId, 20).toLowerCase()
  const dept      = sanitizeStr(body.dept, 20)
  const year      = parseInt(body.year, 10)
  const phone     = sanitizeStr(body.phone || '', 15)
  const regNo     = sanitizeStr(body.regNo || '', 20).toUpperCase()

  if (!name || name.length < 2)  return { valid: false, error: 'Name is required.' }
  if (!/^\d{2}[a-z]{2}\d{3}$/i.test(studentId)) return { valid: false, error: 'Invalid student ID format (e.g. 23cs001).' }
  if (!dept) return { valid: false, error: 'Department is required.' }
  if (![1, 2, 3, 4].includes(year)) return { valid: false, error: 'Year must be 1–4.' }
  if (phone && !/^[6-9]\d{9}$/.test(phone)) return { valid: false, error: 'Invalid phone number.' }
  if (regNo && !/^\d{2}[A-Z]{2}\d{3}$/i.test(regNo)) return { valid: false, error: 'Invalid registration number format.' }

  return { valid: true, data: { name, studentId, dept, year, phone, regNo } }
}
