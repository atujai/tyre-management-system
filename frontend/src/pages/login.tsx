import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Eye, EyeOff, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import { toast } from '@/components/ui/use-toast'

export function LoginPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/login', { name, password })
      const { token, user } = response.data
      setAuth(user, token)
      toast.success('Welcome back!', `Logged in as ${user.name}`)
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(
        'Login failed',
        error.response?.data?.error || 'Invalid credentials'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
            TyreManager
          </h1>
          <p className="text-muted-foreground">
            Fleet Tyre Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12 pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="h-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Demo credentials:</p>
          <p>Admin: Admin User / admin123</p>
          <p>Staff: Staff User / staff123</p>
        </div>
      </div>
    </div>
  )
}