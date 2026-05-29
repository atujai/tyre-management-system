import { useLocation } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/components/ui/toast'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/vehicles': 'Vehicles',
  '/locations': 'Locations & Godowns',
  '/tyres': 'Tyre Bank',
  '/allotment': 'Allotment',
  '/stepney': 'Stepney Management',
  '/history': 'History Log',
  '/users': 'Staff Management',
}

export function Topbar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.info('Logged out successfully')
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-6 gap-4 shrink-0">
      <h1 className="font-heading font-bold text-xl text-foreground">
        {pageTitles[location.pathname] || 'Tyre Management'}
      </h1>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user?.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {user?.role}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
