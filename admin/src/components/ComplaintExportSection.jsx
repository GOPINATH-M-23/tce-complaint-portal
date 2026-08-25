import { useState } from 'react'
import toast from 'react-hot-toast'
import { FileSpreadsheet, Download, RotateCcw, Calendar, Filter } from 'lucide-react'
import { CATEGORIES, STATUSES, PRIORITIES } from '@/utils/constants'
import {
  filterComplaintsForExport,
  generateComplaintsCSV,
  generateCSVFilename,
} from '@/utils/exportUtils'

const DATE_RANGES = [
  'All Time',
  'Last Day',
  'Last Week',
  'Last Month',
  'Last Year',
  'Custom Range',
]

export default function ComplaintExportSection({ complaints = [] }) {
  const [dateRange, setDateRange]   = useState('All Time')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]     = useState('')
  const [status, setStatus]         = useState('All')
  const [priority, setPriority]     = useState('All')
  const [category, setCategory]     = useState('All')
  const [exporting, setExporting]   = useState(false)

  const activeFilters = {
    dateRange,
    customFrom,
    customTo,
    status,
    priority,
    category,
  }

  const matchingComplaints = filterComplaintsForExport(complaints, activeFilters)
  const matchCount = matchingComplaints.length

  const handleClearFilters = () => {
    setDateRange('All Time')
    setCustomFrom('')
    setCustomTo('')
    setStatus('All')
    setPriority('All')
    setCategory('All')
    toast.success('Export filters reset')
  }

  const handleDownloadCSV = () => {
    if (matchCount === 0) {
      toast.error('No complaints match the selected filters.')
      return
    }

    setExporting(true)
    try {
      const csvData = generateComplaintsCSV(matchingComplaints)
      const filename = generateCSVFilename(activeFilters)

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${matchCount} ${matchCount === 1 ? 'complaint' : 'complaints'} to ${filename}`)
    } catch (err) {
      console.error('CSV export error:', err)
      toast.error('Failed to generate CSV file.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="card space-y-4 md:space-y-5 p-4 md:p-6 border border-tce-dark/[0.08] dark:border-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-tce-dark/[0.06] dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-tce-green/10 dark:bg-tce-green/20 flex items-center justify-center text-tce-green shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-base md:text-lg font-bold text-tce-dark dark:text-white">
              Export Complaints CSV
            </h2>
            <p className="text-xs text-tce-muted dark:text-gray-400">
              Filter and download complaint dataset for reporting and analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            matchCount > 0
              ? 'bg-tce-green/10 text-tce-green dark:bg-tce-green/20'
              : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
          }`}>
            {matchCount} {matchCount === 1 ? 'complaint' : 'complaints'} matching
          </span>
        </div>
      </div>

      {/* Quick Date Range Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-tce-dark dark:text-gray-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-tce-green" />
          <span>Date Range</span>
        </label>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {DATE_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                dateRange === range
                  ? 'bg-tce-dark text-white border-tce-dark dark:bg-tce-green dark:border-tce-green dark:text-white shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Pickers */}
      {dateRange === 'Custom Range' && (
        <div className="p-3 bg-tce-cream/50 dark:bg-gray-800/40 rounded-xl border border-tce-dark/[0.06] dark:border-gray-700/50 space-y-2">
          <p className="text-xs font-medium text-tce-dark dark:text-gray-300">
            Specify Custom Date Range (Inclusive)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                className="form-input w-full text-xs"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                To Date (End of Day)
              </label>
              <input
                type="date"
                className="form-input w-full text-xs"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Filters */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-tce-dark dark:text-gray-300 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-tce-green" />
          <span>Attribute Filters</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              Status
            </label>
            <select
              className="form-input w-full text-xs"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              Priority
            </label>
            <select
              className="form-input w-full text-xs"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              Category
            </label>
            <select
              className="form-input w-full text-xs"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
        <button
          type="button"
          onClick={handleClearFilters}
          className="btn-outline text-xs px-3.5 py-2 flex items-center justify-center gap-1.5 order-2 sm:order-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Filters</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadCSV}
          disabled={exporting || matchCount === 0}
          className={`btn-primary text-xs px-5 py-2.5 flex items-center justify-center gap-2 order-1 sm:order-2 ${
            matchCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'Generating CSV…' : `Download CSV (${matchCount})`}</span>
        </button>
      </div>
    </div>
  )
}
