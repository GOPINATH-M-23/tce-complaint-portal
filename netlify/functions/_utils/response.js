/**
 * Centralized HTTP response factory for Netlify Functions.
 * Ensures consistent response shape, CORS headers, and no information leakage.
 */

const ALLOWED_ORIGINS = [
  process.env.APP_URL,
  'http://localhost:5173',
  'http://localhost:8888', // netlify dev
].filter(Boolean)

/**
 * Build CORS headers for the given request origin.
 * Only allows whitelisted origins — blocks all others.
 */
export const corsHeaders = (requestOrigin = '') => {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin':  origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age':       '86400',
    Vary: 'Origin',
  }
}

const base = (statusCode, body, requestOrigin) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders(requestOrigin),
  },
  body: JSON.stringify(body),
})

export const ok = (data, requestOrigin) =>
  base(200, { success: true,  data }, requestOrigin)

export const created = (data, requestOrigin) =>
  base(201, { success: true,  data }, requestOrigin)

export const badRequest = (message, requestOrigin) =>
  base(400, { success: false, error: message }, requestOrigin)

export const unauthorized = (requestOrigin) =>
  base(401, { success: false, error: 'Unauthorized' }, requestOrigin)

export const forbidden = (requestOrigin) =>
  base(403, { success: false, error: 'Forbidden' }, requestOrigin)

export const tooManyRequests = (retryAfter, requestOrigin) => ({
  statusCode: 429,
  headers: {
    'Content-Type': 'application/json',
    'Retry-After':  String(retryAfter),
    ...corsHeaders(requestOrigin),
  },
  body: JSON.stringify({ success: false, error: 'Too many requests. Please slow down.' }),
})

export const serverError = (requestOrigin) =>
  base(500, { success: false, error: 'Internal server error' }, requestOrigin)

/** Handle CORS preflight OPTIONS request */
export const preflight = (requestOrigin) => ({
  statusCode: 204,
  headers: corsHeaders(requestOrigin),
  body: '',
})
