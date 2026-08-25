import { STATUS_COLORS, PRIORITY_COLORS } from './constants'

export const getStatusClass    = (s) => STATUS_COLORS[s]   || 'tag-submitted'
export const getPriorityClass  = (p) => PRIORITY_COLORS[p] || 'tag-low'

export const formatDate = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return '—'

  const day = d.getDate()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[d.getMonth()]
  const year = d.getFullYear()

  let hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const strTime = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`

  return `${day} ${month} ${year} · ${strTime}`
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

// Calendar week definition: Monday 00:00:00.000 to Sunday 23:59:59.999
export const getCurrentWeekRange = (refDate = new Date()) => {
  const date = new Date(refDate)
  const day = date.getDay()
  const diffToMonday = day === 0 ? 6 : day - 1

  const monday = new Date(date)
  monday.setDate(date.getDate() - diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { startOfWeek: monday, endOfWeek: sunday }
}

export const parseComplaintDate = (createdAt) => {
  if (!createdAt) return null
  if (typeof createdAt.toDate === 'function') {
    return createdAt.toDate()
  }
  if (typeof createdAt.seconds === 'number') {
    return new Date(createdAt.seconds * 1000)
  }
  if (createdAt instanceof Date) {
    return createdAt
  }
  const parsed = new Date(createdAt)
  return isNaN(parsed.getTime()) ? null : parsed
}

export const getWeeklyComplaintCount = (complaints = [], refDate = new Date()) => {
  const { startOfWeek, endOfWeek } = getCurrentWeekRange(refDate)
  const startTime = startOfWeek.getTime()
  const endTime = endOfWeek.getTime()

  return complaints.filter((c) => {
    const cDate = parseComplaintDate(c.createdAt)
    if (!cDate) return false
    const t = cDate.getTime()
    return t >= startTime && t <= endTime
  }).length
}

