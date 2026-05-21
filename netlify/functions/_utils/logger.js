/**
 * Centralized structured logger for Netlify Functions.
 * In production, logs appear in Netlify Functions → Logs dashboard.
 * Format is JSON-structured so log aggregators (Datadog, Logtail) can parse it.
 */

const isProd = process.env.NODE_ENV === 'production'

const level = (lvl, msg, meta = {}) => {
  const entry = {
    ts:    new Date().toISOString(),
    level: lvl,
    msg,
    ...meta,
  }
  // In production write JSON; locally write readable format
  if (isProd) {
    console.log(JSON.stringify(entry))
  } else {
    const color = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', debug: '\x1b[90m' }
    console.log(`${color[lvl] || ''}[${lvl.toUpperCase()}]\x1b[0m ${msg}`, Object.keys(meta).length ? meta : '')
  }
}

export const logger = {
  info:  (msg, meta)  => level('info',  msg, meta),
  warn:  (msg, meta)  => level('warn',  msg, meta),
  error: (msg, meta)  => level('error', msg, meta),
  debug: (msg, meta)  => { if (!isProd) level('debug', msg, meta) },

  /** Log an incoming request */
  request: (event, context) => {
    level('info', 'Incoming request', {
      method:    event.httpMethod,
      path:      event.path,
      ip:        event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown',
      ua:        event.headers?.['user-agent']?.slice(0, 80) || '',
      requestId: context?.awsRequestId || '',
    })
  },

  /** Log an outgoing response */
  response: (statusCode, path, durationMs) => {
    level('info', 'Response sent', { statusCode, path, durationMs })
  },
}
