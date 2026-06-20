import { useQuery } from '@tanstack/react-query'
import {
  Truck,
  CircleDot,
  CheckCircle,
  Warehouse,
  AlertTriangle,
  Ban,
  Wrench,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChallanAlertWidget } from '@/components/dashboard/ChallanAlertWidget'
import api from '@/lib/api'
import type { DashboardStats } from '@/types'

const statConfig = [
  { key: 'vehicles', label: 'Vehicles', icon: Truck, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { key: 'totalTyres', label: 'Total Tyres', icon: CircleDot, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { key: 'mounted', label: 'Mounted', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { key: 'inventory', label: 'Inventory', icon: Warehouse, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { key: 'stepney', label: 'Stepneys', icon: CircleDot, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { key: 'repair', label: 'At Retreader', icon: Wrench, color: 'text-red-400', bg: 'bg-red-400/10' },
  { key: 'worn', label: 'Worn', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { key: 'scrapped', label: 'Scrapped', icon: Ban, color: 'text-gray-400', bg: 'bg-gray-400/10' },
]

const stepneyTypeMap: Record<string, { label: string; color: string }> = {
  READY: { label: 'Ready / Good', color: '#22c55e' },
  BURST: { label: 'Burst', color: '#ef4444' },
  CLAIM: { label: 'For Claim', color: '#ec4899' },
  PUNCTURE: { label: 'Puncture', color: '#eab308' },
  RETREAD_CHECKUP: { label: 'Retread Checkup', color: '#f97316' },
}

const actionColors: Record<string, string> = {
  Mounted: '#22c55e',
  Removed: '#f97316',
  Purchased: '#3b82f6',
  'Stepney-Added': '#a855f7',
  'Stepney-Removed': '#f97316',
  Rotated: '#e8920b',
  Scrapped: '#64748b',
  Repair: '#f97316',
  'Sent-Retread': '#f97316',
  'Returned-Retread': '#22c55e',
  'Location-Changed': '#0ea5e9',
}

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

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const counts = stats?.counts

  return (
    <div className="space-y-6">
      {/* Challan Alert Widget - ADDED */}
      <ChallanAlertWidget />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statConfig.map((stat) => {
          const Icon = stat.icon
          const value = counts?.[stat.key as keyof typeof counts] || 0
          return (
            <Card key={stat.key} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-heading font-bold text-foreground mt-1">
                      {value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Stepney Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stepney Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              Stepney Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.stepneyBreakdown && stats.stepneyBreakdown.length > 0 ? (
              <div className="space-y-3">
                {stats.stepneyBreakdown.map((item) => {
                  const config = stepneyTypeMap[item.stepneyType] || {
                    label: item.stepneyType,
                    color: '#94a3b8',
                  }
                  const total = counts?.stepney || 1
                  const pct = Math.round((item._count.id / total) * 100)

                  return (
                    <div key={item.stepneyType} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-sm w-32 shrink-0">{config.label}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: config.color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {item._count.id}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No stepney data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          actionColors[activity.action] || '#94a3b8',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.tyre.serial} — {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.details || ''}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}