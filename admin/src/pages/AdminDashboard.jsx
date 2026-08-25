import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComplaints } from '@/context/ComplaintContext'
import StatCard from '@/components/ui/StatCard'
import ComplaintRow from '@/components/ComplaintRow'
import Spinner from '@/components/ui/Spinner'
import NotificationForm from '@/components/forms/NotificationForm'
import { subscribeAdminNotifications, deleteAdminNotification } from '@/firebase/notifications'
import { groupBy, formatRelative } from '@/utils/helpers'
import toast from 'react-hot-toast'
import { Megaphone, BarChart2, Clock, CheckCircle2, AlertTriangle, ArrowRight, Plus, Trash2, X } from 'lucide-react'

export default function AdminDashboard() {
  const { complaints, loadingComps } = useComplaints()
  const navigate     = useNavigate()

  // activeFilter: null | 'pending' | 'resolved' | 'inprogress'
  const [activeFilter, setActiveFilter] = useState(null)
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [adminNotifs, setAdminNotifs] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  useEffect(() => {
    const unsub = subscribeAdminNotifications(
      (data) => {
        setAdminNotifs(data)
        setLoadingNotifs(false)
      },
      (err) => {
        console.error('Failed to load admin notifications:', err)
        setLoadingNotifs(false)
      }
    )
    return () => unsub?.()
  }, [])

  const handleDeleteNotif = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return
    try {
      await deleteAdminNotification(id)
      toast.success('Notification deleted.')
    } catch (err) {
      toast.error(err.message || 'Failed to delete notification.')
    }
  }

  if (loadingComps) return <Spinner />

  const total      = complaints.length
  const pending    = complaints.filter((c) => !['Resolved', 'Rejected'].includes(c.status)).length
  const resolved   = complaints.filter((c) => c.status === 'Resolved').length
  const critical   = complaints.filter((c) => ['Critical', 'High'].includes(c.priority)).length
  const unread     = complaints.filter((c) => !c.read).length

  const filteredComplaints = (() => {
    if (activeFilter === 'pending')    return complaints.filter((c) => !['Resolved', 'Rejected'].includes(c.status))
    if (activeFilter === 'resolved')   return complaints.filter((c) => c.status === 'Resolved')
    if (activeFilter === 'inprogress') return complaints.filter((c) => c.status === 'In Progress')
    return complaints
  })()

  const byCat   = groupBy(complaints, 'category')
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const toggleFilter = (key) => setActiveFilter((prev) => (prev === key ? null : key))

  const filterLabel = {
    pending:    'Pending',
    resolved:   'Resolved',
    inprogress: 'In Progress',
  }

  return (
    <div className="space-y-5 md:space-y-7 mt-4">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">Dashboard</h1>
          <p className="text-tce-muted dark:text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifModal(!showNotifModal)}
            className="btn-primary text-xs md:text-sm px-3.5 py-1.5 flex items-center gap-1.5 font-medium shrink-0"
          >
            <Megaphone className="w-4 h-4 shrink-0" />
            <span>{showNotifModal ? 'Hide Notification Form' : 'Send Notification'}</span>
          </button>
          {unread > 0 && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-full text-xs font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
              {unread} unread
            </div>
          )}
        </div>
      </div>

      {/* Notification Form Section */}
      {showNotifModal && (
        <div className="transition-all duration-300">
          <NotificationForm onNotificationSent={() => setShowNotifModal(false)} />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div onClick={() => navigate('/complaints')} className="cursor-pointer">
          <StatCard label="Total" value={total} icon={<BarChart2 className="w-8 h-8 md:w-10 md:h-10" />} color="#1f4d3a" />
        </div>

        <div
          onClick={() => toggleFilter('pending')}
          className={`cursor-pointer rounded-2xl transition-all duration-200 ${activeFilter === 'pending' ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-gray-950' : 'hover:opacity-90'}`}
        >
          <StatCard label="Pending" value={pending} icon={<Clock className="w-8 h-8 md:w-10 md:h-10" />} color="#ca8a04" />
        </div>

        <div
          onClick={() => toggleFilter('resolved')}
          className={`cursor-pointer rounded-2xl transition-all duration-200 ${activeFilter === 'resolved' ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-gray-950' : 'hover:opacity-90'}`}
        >
          <StatCard label="Resolved" value={resolved} icon={<CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />} color="#16a34a" />
        </div>

        <div
          onClick={() => toggleFilter('inprogress')}
          className={`cursor-pointer rounded-2xl transition-all duration-200 ${activeFilter === 'inprogress' ? 'ring-2 ring-red-400 ring-offset-2 dark:ring-offset-gray-950' : 'hover:opacity-90'}`}
        >
          <StatCard label="High/Critical" value={critical} icon={<AlertTriangle className="w-8 h-8 md:w-10 md:h-10" />} color="#dc2626" />
        </div>
      </div>

      {/* Active filter badge */}
      {activeFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-tce-muted dark:text-gray-400">
            Showing <strong className="text-tce-dark dark:text-white">{filterLabel[activeFilter]}</strong> complaints
            ({filteredComplaints.length})
          </span>
          <button
            onClick={() => setActiveFilter(null)}
            className="text-xs text-tce-green hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-1"
          >
            <span>Clear filter</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5 md:gap-6">
        {/* Complaints list */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white">
              {activeFilter ? `${filterLabel[activeFilter]} Complaints` : 'Recent Complaints'}
            </h2>
            <button
              className="text-sm text-tce-green hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-1"
              onClick={() => navigate('/complaints')}
            >
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {filteredComplaints.slice(0, 5).map((c) => (
              <ComplaintRow key={c.id} complaint={c} />
            ))}
            {filteredComplaints.length === 0 && (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
                No complaints in this category
              </p>
            )}
          </div>
        </div>

        {/* Category breakdown & Recent Admin Notifications */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white mb-4">Top Categories</h2>
            <div className="space-y-3">
              {topCats.map(([cat, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[75%]">{cat}</span>
                      <span className="text-tce-green font-semibold">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-tce-green rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {topCats.length === 0 && (
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">No data yet</p>
              )}
            </div>
          </div>

          {/* Broadcast Notifications List */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold text-tce-dark dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-tce-green shrink-0" />
                <span>Sent Notifications</span>
              </h2>
              <button
                onClick={() => setShowNotifModal(true)}
                className="text-xs text-tce-green font-medium hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {loadingNotifs ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading notifications...</p>
            ) : adminNotifs.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No broadcast notifications sent yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {adminNotifs.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-tce-dark dark:text-white leading-snug">
                        {n.title || 'Notification'}
                      </h3>
                      <button
                        onClick={() => handleDeleteNotif(n.id)}
                        className="text-gray-400 hover:text-red-500 text-xs bg-transparent border-0 cursor-pointer p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {n.message}
                    </p>

                    {n.imageUrl && (
                      <div className="mt-1.5 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-32 bg-gray-900 flex items-center justify-center">
                        <img
                          src={n.imageUrl}
                          alt="Notification attachment"
                          className="max-h-32 w-full object-contain"
                        />
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
