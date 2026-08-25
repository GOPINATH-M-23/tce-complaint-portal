import { useState } from 'react'
import { useComplaints } from '@/context/ComplaintContext'
import ComplaintRow from '@/components/ComplaintRow'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { CATEGORIES, STATUSES, PRIORITIES } from '@/utils/constants'
import { ClipboardList } from 'lucide-react'

export default function AllComplaints() {
  const { complaints, loadingComps } = useComplaints()

  const [search,    setSearch]    = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [filterSt,  setFilterSt]  = useState('All')
  const [filterPri, setFilterPri] = useState('All')
  const [sortBy,    setSortBy]    = useState('newest')

  if (loadingComps) return <Spinner />

  const filtered = complaints
    .filter((c) => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        c.title.toLowerCase().includes(q) ||
        c.studentName?.toLowerCase().includes(q) ||
        c.studentId?.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      return matchSearch &&
        (filterCat === 'All' || c.category === filterCat) &&
        (filterSt  === 'All' || c.status   === filterSt)  &&
        (filterPri === 'All' || c.priority  === filterPri)
    })
    .sort((a, b) => {
      if (sortBy === 'newest')   return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      if (sortBy === 'oldest')   return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      if (sortBy === 'priority') {
        const order = { Critical: 4, High: 3, Medium: 2, Low: 1 }
        return (order[b.priority] || 0) - (order[a.priority] || 0)
      }
      return 0
    })

  const unread = complaints.filter((c) => !c.read).length

  return (
    <div className="space-y-4 md:space-y-5 mt-4">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">All Complaints</h1>
        <p className="text-tce-muted dark:text-gray-400 text-sm mt-0.5">
          {complaints.length} total · {unread} unread
        </p>
      </div>

      {/* Filters — scrollable on mobile */}
      <div className="card p-3 md:p-5">
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:pb-0 md:items-center">
          <input
            className="form-input shrink-0 w-44 md:max-w-xs"
            placeholder="Search title, student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="form-input w-auto shrink-0" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="form-input w-auto shrink-0" value={filterSt} onChange={(e) => setFilterSt(e.target.value)}>
            <option value="All">All Status</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="form-input w-auto shrink-0" value={filterPri} onChange={(e) => setFilterPri(e.target.value)}>
            <option value="All">All Priority</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className="form-input w-auto shrink-0" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="priority">Priority</option>
          </select>
          <span className="text-xs text-tce-muted dark:text-gray-400 ml-auto self-center shrink-0">
            {filtered.length} results
          </span>
        </div>
      </div>

      {/* List — complaint ID is not shown in the row (tracked in backend only) */}
      {filtered.length === 0 ? (
        <EmptyState 
          icon={<ClipboardList className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />} 
          title="No complaints found" 
          desc="Try adjusting your filters." 
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ComplaintRow key={c.id} complaint={c} isAdmin />
          ))}
        </div>
      )}
    </div>
  )
}
