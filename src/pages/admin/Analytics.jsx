import { useComplaints } from '@/context/ComplaintContext'
import CategoryBarChart from '@/components/charts/CategoryBarChart'
import StatusDoughnutChart from '@/components/charts/StatusDoughnutChart'
import PriorityBarChart from '@/components/charts/PriorityBarChart'
import TrendLineChart from '@/components/charts/TrendLineChart'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import { groupBy, sortedEntries } from '@/utils/helpers'

export default function Analytics() {
  const { complaints, loadingComps } = useComplaints()

  if (loadingComps) return <Spinner />

  const total    = complaints.length
  const resolved = complaints.filter((c) => c.status === 'Resolved').length
  const rate     = total > 0 ? Math.round((resolved / total) * 100) : 0
  const byCat    = groupBy(complaints, 'category')
  const topIssue = sortedEntries(byCat)[0]

  return (
    <div className="space-y-5 md:space-y-6 mt-4">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">Analytics</h1>
        <p className="text-tce-muted dark:text-gray-400 text-sm mt-0.5">Campus complaint insights and trends</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Complaints"  value={total}       icon="📊" color="#1f4d3a" />
        <StatCard label="Resolution Rate"   value={`${rate}%`}  icon="✅" color="#16a34a" />
        <StatCard label="Top Issue"         value={topIssue?.[0]?.split(' ')[0] || '—'} icon="📌" color="#7c3aed" />
        <StatCard label="Unresolved"        value={total - resolved} icon="⏳" color="#ca8a04" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-5 md:gap-6">
        <div className="lg:col-span-2 card overflow-x-auto">
          <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white mb-4">
            Complaints by Category
          </h2>
          <div className="min-w-[320px]">
            <CategoryBarChart complaints={complaints} />
          </div>
        </div>
        <div className="card">
          <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white mb-4">
            Status Distribution
          </h2>
          <StatusDoughnutChart complaints={complaints} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
        <div className="card">
          <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white mb-4">
            7-Day Trend
          </h2>
          <TrendLineChart complaints={complaints} />
        </div>
        <div className="card">
          <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white mb-4">
            Priority Breakdown
          </h2>
          <PriorityBarChart complaints={complaints} />
        </div>
      </div>

      {/* Summary table — scroll on mobile */}
      <div className="card overflow-x-auto">
        <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white mb-4">
          Category Summary
        </h2>
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-tce-dark/10 dark:border-gray-700">
              <th className="text-left py-2 text-tce-muted dark:text-gray-400 font-medium">#</th>
              <th className="text-left py-2 text-tce-muted dark:text-gray-400 font-medium">Category</th>
              <th className="text-right py-2 text-tce-muted dark:text-gray-400 font-medium">Count</th>
              <th className="text-right py-2 text-tce-muted dark:text-gray-400 font-medium">% of Total</th>
              <th className="text-right py-2 text-tce-muted dark:text-gray-400 font-medium">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries(byCat).map(([cat, count], i) => {
              const catResolved = complaints.filter((c) => c.category === cat && c.status === 'Resolved').length
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0
              return (
                <tr key={cat} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-2.5 text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="py-2.5 text-tce-dark dark:text-white font-medium">{cat}</td>
                  <td className="py-2.5 text-right font-semibold text-tce-dark dark:text-white">{count}</td>
                  <td className="py-2.5 text-right text-gray-500 dark:text-gray-400">{pct}%</td>
                  <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">{catResolved}</td>
                </tr>
              )
            })}
            {Object.keys(byCat).length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
