// src/components/layout/sidebar.tsx
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  Warehouse,
  CircleDot,
  Network,
  History,
  Users,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
  FileText,
  MapPin,
  Fuel,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import type { Permissions } from '@/stores/auth'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  permissionKey: keyof Permissions
}

const allNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'dashboard' },
  { path: '/vehicles', label: 'Vehicles', icon: Truck, permissionKey: 'vehicles' },
  { path: '/locations', label: 'Locations', icon: Warehouse, permissionKey: 'locations' },
  { path: '/tyres', label: 'Tyre Bank', icon: CircleDot, permissionKey: 'tyres' },
  { path: '/allotment', label: 'Allotment', icon: Network, permissionKey: 'allotment' },
  { path: '/stepney', label: 'Stepney', icon: RotateCcw, permissionKey: 'stepney' },
  { path: '/challans', label: 'Challans', icon: ShieldAlert, permissionKey: 'vehicles' },
  { path: '/documents', label: 'Documents', icon: FileText, permissionKey: 'vehicles' },
  { path: '/gps', label: 'GPS Tracking', icon: MapPin, permissionKey: 'dashboard' },
  { path: '/fuel', label: 'Fuel Monitor', icon: Fuel, permissionKey: 'dashboard' },
  { path: '/dashcam', label: 'Dashcams', icon: Video, permissionKey: 'dashboard' },
  { path: '/history', label: 'History', icon: History, permissionKey: 'history' },
  { path: '/users', label: 'Staff', icon: Users, permissionKey: 'users' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, hasPermission } = useAuthStore()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN'

  const visibleNavItems = allNavItems.filter((item) =>
    isAdmin ? true : hasPermission(item.permissionKey)
  )

  const regularItems = visibleNavItems.filter((item) => item.permissionKey !== 'users')
  const adminItems = visibleNavItems.filter((item) => item.permissionKey === 'users')

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-sm shrink-0">
          T
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-white">
            TyreManager
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {regularItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}

        {adminItems.length > 0 && (
          <>
            <div className="mx-4 my-3 border-t border-slate-800" />
            {!collapsed && (
              <p className="px-4 text-xs text-slate-500 uppercase tracking-wider mb-2">
                Admin
              </p>
            )}
            {adminItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )
            })}
          </>
        )}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-4 border-t border-slate-800 text-slate-400 hover:text-white transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5 mx-auto" />
        ) : (
          <div className="flex items-center gap-2">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Collapse</span>
          </div>
        )}
      </button>
    </aside>
  )
}