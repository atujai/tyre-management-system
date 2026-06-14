import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { format } from 'date-fns'
import {
  Search,
  Filter,
  History,
  Truck,
  CircleDot,
  ArrowRightLeft,
  RotateCcw,
  Wrench,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react'

interface HistoryItem {
  id: string
  action: string
  date: string
  notes: string | null
  position: string | null
  tyreId: string
  vehicleId: string | null
  userId: string
  createdAt: string
  tyre: { serial: string; brand: string }
  vehicle: { reg: string; type: string } | null
  user: { name: string }
}

interface HistoryResponse {
  history: HistoryItem[]
  total: number
}

const PAGE_SIZE = 20

const actionConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  MOUNTED: { label: 'Mounted', icon: Wrench, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  UNMOUNTED: { label: 'Unmounted', icon: ArrowRightLeft, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ROTATED: { label: 'Rotated', icon: RotateCcw, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  INSPECTED: { label: 'Inspected', icon: CircleDot, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  SCRAPPED: { label: 'Scrapped', icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  CREATED: { label: 'Created', icon: CircleDot, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  UPDATED: { label: 'Updated', icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  STEPNEY_ADDED: { label: 'Stepney Added', icon: Truck, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  STEPNEY_REMOVED: { label: 'Stepney Removed', icon: Truck, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
}

export function HistoryPage() {
  const token = useAuthStore((state: any) => state.token)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, error, refetch } = useQuery<HistoryResponse>({
    queryKey: ['history', page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      const res = await fetch(`/api/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch history')
      return res.json()
    },
  })

  const filteredHistory = data?.history.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.tyre.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tyre.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicle?.reg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicle?.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = !filterAction || item.action === filterAction
    return matchesSearch && matchesAction
  })

  const handleClearHistory = async () => {
    if (!confirm('Are you sure?')) return
    const res = await fetch('/api/history/clear', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) { alert('Cleared!'); refetch() }
    else alert('Failed')
  }

  const handleExport = () => {
    if (!filteredHistory?.length) { alert('No data'); return }
    const csv = [
      ['Date', 'Action', 'Tyre Serial', 'Tyre Brand', 'Vehicle Reg', 'Vehicle Type', 'Position', 'User', 'Notes'].join(','),
      ...filteredHistory.map((h) => [
        format(new Date(h.date), 'yyyy-MM-dd HH:mm'),
        h.action, h.tyre.serial, h.tyre.brand,
        h.vehicle?.reg || '-', h.vehicle?.type || '-',
        h.position || '-', h.user.name, h.notes || '-',
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tyre-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    alert('Exported!')
  }

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <History className="w-7 h-7 text-blue-400" />
            History & Activity Log
          </h1>
          <p className="text-slate-400 mt-1">Track tyre movements by serial number or vehicle registration</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handleClearHistory} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 text-sm">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search tyre serial, vehicle reg, brand..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0) }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(0) }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm appearance-none">
              <option value="">All Actions</option>
              {Object.entries(actionConfig).map(([key, c]) => <option key={key} value={key}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || filterAction) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500">Active filters:</span>
            {searchTerm && <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">Search: {searchTerm} <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-300">×</button></span>}
            {filterAction && <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">Action: {actionConfig[filterAction]?.label} <button onClick={() => setFilterAction('')} className="ml-1 hover:text-blue-300">×</button></span>}
            <button onClick={() => { setSearchTerm(''); setFilterAction(''); setPage(0) }} className="text-xs text-slate-400 hover:text-white underline ml-auto">Clear all</button>
          </div>
        )}
      </div>

      {/* Results */}
      <p className="text-sm text-slate-400">
        {data ? <>Showing <span className="text-white">{page * PAGE_SIZE + 1}</span> - <span className="text-white">{Math.min((page + 1) * PAGE_SIZE, data.total)}</span> of <span className="text-white">{data.total}</span> records {filteredHistory && filteredHistory.length !== data.history.length && <span className="text-slate-500">({filteredHistory.length} matching)</span>}</> : 'Loading...'}
      </p>

      {/* Timeline */}
      {isLoading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      : error ? <div className="text-center py-20"><AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" /><p className="text-lg text-white">Failed to load</p><p className="text-sm text-slate-500">{(error as Error).message}</p></div>
      : !filteredHistory?.length ? <div className="text-center py-20"><History className="w-12 h-12 mx-auto mb-3 text-slate-600" /><p className="text-lg text-white">No records found</p><p className="text-sm text-slate-500">Try adjusting filters</p></div>
      : <div className="space-y-3">{filteredHistory.map((item) => {
          const c = actionConfig[item.action] || actionConfig.UPDATED
          const Icon = c.icon
          return (
            <div key={item.id} className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border ${c.bg} w-fit`}>
                  <Icon className={`w-4 h-4 ${c.color}`} />
                  <span className={`text-sm font-medium ${c.color}`}>{c.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <div className="flex items-center gap-1.5"><CircleDot className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-300 font-medium">{item.tyre.serial}</span><span className="text-slate-500">({item.tyre.brand})</span></div>
                    {item.vehicle && <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-300 font-medium">{item.vehicle.reg}</span><span className="text-slate-500">{item.vehicle.type}</span></div>}
                    {item.position && <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">Position: {item.position}</span>}
                  </div>
                  {item.notes && <p className="mt-2 text-sm text-slate-400 bg-slate-950/50 rounded-lg px-3 py-2 border border-slate-800/50">{item.notes}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(item.date), 'MMM dd, yyyy HH:mm')}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.user.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}</div>}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 text-sm"><ChevronLeft className="w-4 h-4" /> Previous</button>
          <div className="flex items-center gap-1">{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = totalPages <= 5 ? i : page < 2 ? i : page > totalPages - 3 ? totalPages - 5 + i : page - 2 + i
            return <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-8 h-8 rounded-lg text-sm font-medium ${pageNum === page ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>{pageNum + 1}</button>
          })}</div>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 text-sm">Next <ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  )
}