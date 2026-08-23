import { STATUS_COLORS, PRIORITY_COLORS } from './constants'

export const getStatusClass    = (s) => STATUS_COLORS[s]   || 'tag-submitted'
export const getPriorityClass  = (p) => PRIORITY_COLORS[p] || 'tag-low'

export const formatDate = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatRelative = (ts) => {
  if (!ts) return ''
  const d    = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export const truncate = (str, n = 60) =>
  str?.length > n ? str.slice(0, n) + '…' : str

// Group complaints by field and count
export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = item[key] || 'Unknown'
    acc[k]  = (acc[k] || 0) + 1
    return acc
  }, {})

// Sort object entries by value desc
export const sortedEntries = (obj) =>
  Object.entries(obj).sort((a, b) => b[1] - a[1])

export const generateComplaintId = () =>
  'C' + Date.now().toString(36).toUpperCase().slice(-5)
