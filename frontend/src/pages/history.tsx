import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Clock, ArrowRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { HistoryEntry } from '@/types'

const actionIcons: Record<string, string> = {
  Mounted: 'CheckCircle',
  Removed: 'ArrowRight',
  Purchased: 'ShoppingCart',
  'Stepney-Added': 'Plus',
  'Stepney-Removed': 'Minus',
  Rotated: 'RefreshCw',
  Scrapped: 'Trash2',
  Repair: 'Wrench',
  'Sent-Retread': 'Truck',
  'Returned-Retread': 'RotateCcw',
  'Location-Changed': 'ArrowLeftRight',
}

const actionColors: Record<string, string> = {
  Mounted: 'text-emerald-400',
  Removed: 'text-orange-400',
  Purchased: 'text-blue-400',
  'Stepney-Added': 'text-purple-400',
  'Stepney-Removed': 'text-orange-400',
  Rotated: 'text-amber-400',
  Scrapped: 'text-gray-400',
  Repair: 'text-orange-400',
  'Sent-Retread': 'text-orange-400',
  'Returned-Retread': 'text-emerald-400',
  'Location-Changed': 'text-sky-400',
}

export function HistoryPage() {
  const [page, setPage] = useState(0)
  const limit = 50

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ history: HistoryEntry[]; total: number }>({
    queryKey: ['history', page],
    queryFn: async () => {
      const response = await api.get(`/history?limit=${limit}&offset=${page * limit}`)
      return response.data
    },
  })

  const clearMutation = useMutation({
    mutationFn: () => api.delete('/history/clear'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] })
      toast.success('History cleared')
    },
    onError: () => {
      toast.error('Failed to clear history')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const history = data?.history || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {total} entries
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm('Clear all history? This cannot be undone.')) {
              clearMutation.mutate()
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Action
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Tyre
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Vehicle
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Position
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold text-sm ${actionColors[entry.action] || 'text-muted-foreground'}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-sm">
                    {entry.tyre.serial}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {entry.vehicle ? (
                      <span>{entry.vehicle.reg}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {entry.axleIndex !== null ? (
                      <span>
                        Axle {entry.axleIndex + 1}
                        {entry.position ? ` / ${entry.position}` : ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[300px] truncate">
                    {entry.details || '—'}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No history entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
