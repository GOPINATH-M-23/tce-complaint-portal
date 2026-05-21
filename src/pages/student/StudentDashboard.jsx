import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintContext'
import StatCard from '@/components/ui/StatCard'
import ComplaintRow from '@/components/ComplaintRow'
import Spinner from '@/components/ui/Spinner'
import { formatRelative } from '@/utils/helpers'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { complaints, notifications, loadingComps } = useComplaints()
  const navigate = useNavigate()

  if (loadingComps) return <Spinner />

  const total    = complaints.length
  const pending  = complaints.filter((c) => !['Resolved', 'Rejected'].includes(c.status)).length
  const resolved = complaints.filter((c) => c.status === 'Resolved').length
  const replied  = complaints.filter((c) => c.adminReply).length

  return (
    <div className="space-y-5 md:space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-tce-muted dark:text-gray-400 text-sm mt-0.5 truncate max-w-[220px] md:max-w-none">
            {user?.email}
          </p>
        </div>
        <button
          className="btn-primary text-sm px-4 py-2 shrink-0 hidden md:inline-flex"
          onClick={() => navigate('/student/complaints/new')}
        >
          + New Complaint
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total"    value={total}    icon="📊" color="#1f4d3a" />
        <StatCard label="Pending"  value={pending}  icon="⏳" color="#ca8a04" />
        <StatCard label="Resolved" value={resolved} icon="✅" color="#16a34a" />
        <StatCard label="Replies"  value={replied}  icon="💬" color="#7c3aed" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5 md:gap-6">
        {/* Recent complaints */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white">
              Recent Complaints
            </h2>
            <button
              className="text-sm text-tce-green hover:underline bg-transparent border-0 cursor-pointer"
              onClick={() => navigate('/student/complaints')}
            >
              View all →
            </button>
          </div>
          {complaints.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No complaints yet</p>
              <button className="btn-primary mt-4 text-sm" onClick={() => navigate('/student/complaints/new')}>
                Submit first complaint
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 4).map((c) => (
                <ComplaintRow key={c.id} complaint={c} isAdmin={false} />
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white">
              Notifications
            </h2>
            <button
              className="text-sm text-tce-green hover:underline bg-transparent border-0 cursor-pointer"
              onClick={() => navigate('/student/notifications')}
            >
              View all →
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl text-sm ${
                    n.read
                      ? 'bg-gray-50 dark:bg-gray-800/50'
                      : 'bg-tce-dark/5 dark:bg-tce-dark/20 border border-tce-dark/10 dark:border-tce-green/20'
                  }`}
                >
                  <p className={`text-gray-700 dark:text-gray-300 leading-snug text-xs md:text-sm ${!n.read ? 'font-medium' : ''}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-tce-green dark:text-tce-green/70 mt-1">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
