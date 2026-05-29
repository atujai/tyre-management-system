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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vehicles', label: 'Vehicles', icon: Truck },
  { path: '/locations', label: 'Locations', icon: Warehouse },
  { path: '/tyres', label: 'Tyre Bank', icon: CircleDot },
  { path: '/allotment', label: 'Allotment', icon: Network },
  { path: '/stepney', label: 'Stepney', icon: CircleDot },
  { path: '/history', label: 'History', icon: History },
]

const adminNavItems = [
  { path: '/users', label: 'Staff', icon: Users },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuthStore()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          T
        </div>
        {!collapsed && (
          <span className="font-heading font-bold text-lg text-foreground">
            TyreManager
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}

        {isAdmin && (
          <>
            <div className="mx-4 my-3 border-t border-border" />
            {!collapsed && (
              <p className="px-4 text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Admin
              </p>
            )}
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
        className="p-4 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
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
