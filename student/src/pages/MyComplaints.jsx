import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComplaints } from '@/context/ComplaintContext'
import ComplaintRow from '@/components/ComplaintRow'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { CATEGORIES, STATUSES } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/helpers'
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/ui/Badge'
import { ClipboardList, X } from 'lucide-react'

export default function MyComplaints() {
  const { complaints, loadingComps } = useComplaints()
  const navigate = useNavigate()
  const [search,    setSearch]    = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [filterSt,  setFilterSt]  = useState('All')
  const [selected,  setSelected]  = useState(null)

  if (loadingComps) return <Spinner />

  const filtered = complaints.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        c.category.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filterCat === 'All' || c.category === filterCat
    const matchSt     = filterSt  === 'All' || c.status   === filterSt
    return matchSearch && matchCat && matchSt
  })

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">
            Past Complaints
          </h1>
          <p className="text-tce-muted dark:text-gray-400 text-sm mt-0.5">{complaints.length} total submitted</p>
        </div>
        <button className="btn-primary text-sm px-4 py-2 hidden md:inline-flex" onClick={() => navigate('/complaints/new')}>
          + New Complaint
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 md:p-5">
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:pb-0 md:items-center">
          <input
            className="form-input shrink-0 w-44 md:max-w-xs"
            placeholder="Search…"
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
          <span className="text-xs text-tce-muted dark:text-gray-400 ml-auto self-center shrink-0">
            {filtered.length} results
          </span>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />}
          title="No past complaints found"
          desc="Try adjusting your filters or submit a new complaint."
          action={
            <button className="btn-primary" onClick={() => navigate('/complaints/new')}>
              New Complaint
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ComplaintRow key={c.id} complaint={c} onClick={setSelected} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-display text-lg md:text-xl font-bold text-tce-dark dark:text-white pr-4">
                {selected.title}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl bg-transparent border-0 cursor-pointer shrink-0 flex items-center justify-center p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <CategoryBadge category={selected.category} />
              <StatusBadge status={selected.status} />
              <PriorityBadge priority={selected.priority} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 p-3.5 bg-tce-cream dark:bg-gray-800 rounded-xl">
              {selected.description}
            </p>
            {selected.imageUrl && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Student Proof Image</p>
                <img src={selected.imageUrl} alt="Student complaint proof" className="w-full rounded-xl max-h-56 object-cover border border-gray-200 dark:border-gray-700" />
              </div>
            )}
            {selected.adminReply && (
              <div className="p-3.5 bg-tce-green/8 dark:bg-tce-green/10 border-l-4 border-tce-green rounded-xl space-y-2">
                <p className="text-xs font-semibold text-tce-green">Admin Response</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selected.adminReply}</p>
                {selected.adminResponseImageUrl && (
                  <div className="mt-2.5 pt-2 border-t border-tce-green/20">
                    <p className="text-xs font-semibold text-tce-green mb-1.5">Proof / Response Image</p>
                    <a href={selected.adminResponseImageUrl} target="_blank" rel="noopener noreferrer" className="block group">
                      <img
                        src={selected.adminResponseImageUrl}
                        alt="Admin response proof"
                        className="w-full rounded-xl max-h-56 object-contain bg-gray-900 border border-tce-green/30"
                      />
                    </a>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-right">
              Submitted on {formatDateTime(selected.createdAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
