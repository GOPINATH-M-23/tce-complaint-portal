import { useNavigate } from 'react-router-dom'
import { useComplaints } from '@/context/ComplaintContext'
import { useAuth } from '@/context/AuthContext'
import StatCard from '@/components/ui/StatCard'
import ComplaintRow from '@/components/ComplaintRow'
import Spinner from '@/components/ui/Spinner'
import { groupBy } from '@/utils/helpers'

export default function AdminDashboard() {
  const { complaints, loadingComps } = useComplaints()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (loadingComps) return <Spinner />

  const total    = complaints.length
  const pending  = complaints.filter((c) => !['Resolved', 'Rejected'].includes(c.status)).length
  const resolved = complaints.filter((c) => c.status === 'Resolved').length
  const critical = complaints.filter((c) => ['Critical', 'High'].includes(c.priority)).length
  const unread   = complaints.filter((c) => !c.read).length

  const byCat  = groupBy(complaints, 'category')
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6)

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
        {unread > 0 && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-full text-xs font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
            {unread} unread
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total"         value={total}    icon="📊" color="#1f4d3a" />
        <StatCard label="Pending"       value={pending}  icon="⏳" color="#ca8a04" />
        <StatCard label="Resolved"      value={resolved} icon="✅" color="#16a34a" />
        <StatCard label="High/Critical" value={critical} icon="🚨" color="#dc2626" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5 md:gap-6">
        {/* Recent complaints */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white">Recent Complaints</h2>
            <button className="text-sm text-tce-green hover:underline bg-transparent border-0 cursor-pointer"
              onClick={() => navigate('/admin/complaints')}>
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {complaints.slice(0, 5).map((c) => (
              <ComplaintRow key={c.id} complaint={c} isAdmin />
            ))}
            {complaints.length === 0 && (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No complaints yet</p>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="lg:col-span-2 card">
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
            {topCats.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
