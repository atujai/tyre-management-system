import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Pencil, Trash2, Save, X, Shield, User, LayoutDashboard, Truck, MapPin, Circle, GitBranch, RotateCcw, History, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'

// Inline type — no external types.ts needed
interface UserType {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'STAFF'
  isActive: boolean
  permissions?: Record<string, boolean>
  createdAt: string
}

const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'vehicles', label: 'Vehicles', icon: Truck },
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'tyres', label: 'Tyres', icon: Circle },
  { key: 'allotment', label: 'Allotment', icon: GitBranch },
  { key: 'stepney', label: 'Stepney', icon: RotateCcw },
  { key: 'history', label: 'History', icon: History },
  { key: 'users', label: 'Users', icon: Users },
] as const

const DEFAULT_PERMISSIONS = {
  dashboard: true,
  vehicles: true,
  locations: true,
  tyres: true,
  allotment: true,
  stepney: true,
  history: true,
  users: false,
}

function getErrorMessage(error: any): string {
  const msg = error?.response?.data?.error
  if (typeof msg === 'string') return msg
  if (msg) return JSON.stringify(msg)
  return 'An unexpected error occurred'
}

export function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF',
    permissions: { ...DEFAULT_PERMISSIONS },
  })

  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/auth/users')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/auth/register', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsModalOpen(false)
      resetForm()
      toast.success('User created successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to create user', getErrorMessage(error))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      api.patch(`/auth/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsModalOpen(false)
      resetForm()
      setEditingUser(null)
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to update user', getErrorMessage(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to delete user', getErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/auth/users/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User status updated')
    },
    onError: () => {
      toast.error('Failed to update user')
    },
  })

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', role: 'STAFF', permissions: { ...DEFAULT_PERMISSIONS } })
  }

  const openCreateModal = () => {
    resetForm()
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const openEditModal = (user: UserType) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      permissions: user.permissions || { ...DEFAULT_PERMISSIONS },
    })
    setIsModalOpen(true)
  }

  const openDeleteDialog = (user: UserType) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key as keyof typeof prev.permissions],
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      const updateData: Partial<typeof formData> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions,
      }
      if (formData.password) {
        updateData.password = formData.password
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {users?.length || 0} staff member(s)
        </p>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users?.map((user: UserType) => (
          <Card key={user.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  user.role === 'ADMIN'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {user.role === 'ADMIN' ? (
                    <Shield className="h-6 w-6" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-foreground">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        title="Edit user"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(user)}
                        title="Delete user"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMutation.mutate(user.id)}
                      className="h-6 px-2"
                    >
                      {user.isActive ? (
                        <Badge variant="default" className="text-[10px] cursor-pointer">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] cursor-pointer">Inactive</Badge>
                      )}
                    </Button>
                  </div>
                  {/* Permissions display */}
                  {user.role === 'STAFF' && user.permissions && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Access</p>
                      <div className="flex flex-wrap gap-1">
                        {SECTIONS.filter(s => user.permissions?.[s.key]).map(section => (
                          <Badge key={section.key} variant="outline" className="text-[10px] px-1.5 py-0">
                            <section.icon className="h-3 w-3 mr-1" />
                            {section.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit Staff Member' : 'Add Staff Member'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Full Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                required={!editingUser}
                minLength={editingUser && !formData.password ? undefined : 6}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  const role = e.target.value as 'ADMIN' | 'STAFF'
                  setFormData({
                    ...formData,
                    role,
                    permissions: role === 'ADMIN'
                      ? { dashboard: true, vehicles: true, locations: true, tyres: true, allotment: true, stepney: true, history: true, users: true }
                      : { ...DEFAULT_PERMISSIONS }
                  })
                }}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Permissions Section */}
            {formData.role === 'STAFF' && (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Section Access
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      permissions: Object.fromEntries(
                        SECTIONS.map(s => [s.key, true])
                      ) as typeof prev.permissions
                    }))}
                  >
                    Grant All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SECTIONS.map(section => {
                    const Icon = section.icon
                    const isGranted = formData.permissions[section.key as keyof typeof formData.permissions]
                    return (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() => togglePermission(section.key)}
                        className={`flex items-center gap-2 p-2 rounded-md border text-left transition-colors ${
                          isGranted
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                          isGranted
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }`}>
                          {isGranted && <CheckSquare className="h-3.5 w-3.5" />}
                        </div>
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-medium">{section.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingUser(null)
                  resetForm()
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting
                  ? 'Saving...'
                  : editingUser
                  ? 'Update User'
                  : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setUserToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}