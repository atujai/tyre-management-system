import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { Tyre, Location } from '@/types'

const BRANDS = ['Michelin', 'Bridgestone', 'CEAT', 'MRF', 'Apollo', 'Goodyear', 'JK', 'Other']
const SIZES = ['295/80R22.5', '315/80R22.5', '11.00R20', '12.00R20', '10.00R20', '9.00R20', '7.50R16', 'Other']
const STATUSES = ['MOUNTED', 'INVENTORY', 'STEPNEY', 'WORN', 'DAMAGED', 'REPAIR', 'SCRAPPED'] as const

function getErrorMessage(error: any): string {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message
  }
  if (typeof error?.response?.data?.error === 'string') {
    return error.response.data.error
  }
  if (Array.isArray(error?.response?.data?.error)) {
    return error.response.data.error.map((e: any) => e.message || JSON.stringify(e)).join(', ')
  }
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return 'An error occurred'
}

export function TyresPage() {
  const [filter, setFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTyre, setEditingTyre] = useState<Tyre | null>(null)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    serial: '',
    brand: 'Michelin',
    size: '295/80R22.5',
    pattern: '',
    purchaseDate: '',
    initialTread: 20,
    currentTread: 20,
    status: 'INVENTORY' as typeof STATUSES[number],
    cost: '',
    remarks: '',
    locationId: '',
  })

  const queryClient = useQueryClient()

  const { data: tyres, isLoading } = useQuery<Tyre[]>({
    queryKey: ['tyres', filter, locationFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (locationFilter !== 'all') params.append('locationId', locationFilter)
      if (searchQuery) params.append('search', searchQuery)
      const response = await api.get(`/tyres?${params}`)
      return response.data
    },
  })

  const { data: locations } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get('/locations')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/tyres', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tyres'] })
      setIsModalOpen(false)
      resetForm()
      toast.success('Tyre added successfully')
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/tyres/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tyres'] })
      setIsModalOpen(false)
      setEditingTyre(null)
      resetForm()
      toast.success('Tyre updated')
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tyres/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tyres'] })
      toast.success('Tyre removed')
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const resetForm = () => {
    setFormData({
      serial: '',
      brand: 'Michelin',
      size: '295/80R22.5',
      pattern: '',
      purchaseDate: '',
      initialTread: 20,
      currentTread: 20,
      status: 'INVENTORY',
      cost: '',
      remarks: '',
      locationId: '',
    })
    setCapturedImages([])
  }

  const openEditModal = (tyre: Tyre) => {
    setEditingTyre(tyre)
    setFormData({
      serial: tyre.serial,
      brand: tyre.brand,
      size: tyre.size,
      pattern: tyre.pattern || '',
      purchaseDate: tyre.purchaseDate ? new Date(tyre.purchaseDate).toISOString().split('T')[0] : '',
      initialTread: tyre.initialTread,
      currentTread: tyre.currentTread,
      status: tyre.status,
      cost: tyre.cost?.toString() || '',
      remarks: tyre.remarks || '',
      locationId: tyre.locationId || '',
    })
    setCapturedImages(tyre.images?.map((img) => img.url) || [])
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Build JSON payload with proper types
    const payload: any = {
      serial: formData.serial,
      brand: formData.brand,
      size: formData.size,
      status: formData.status,
      initialTread: Number(formData.initialTread),
      currentTread: Number(formData.currentTread),
      withRim: true,
    }

    if (formData.pattern) payload.pattern = formData.pattern
    if (formData.purchaseDate) payload.purchaseDate = formData.purchaseDate
    if (formData.cost) payload.cost = Number(formData.cost)
    if (formData.remarks) payload.remarks = formData.remarks
    if (formData.locationId) payload.locationId = formData.locationId

    // Include new base64 images
    const newImages = capturedImages.filter(img => img.startsWith('data:'))
    if (newImages.length > 0) {
      payload.images = newImages
    }

    if (editingTyre) {
      updateMutation.mutate({ id: editingTyre.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const getTreadColor = (current: number, initial: number) => {
    const pct = initial > 0 ? (current / initial) * 100 : 100
    if (pct > 50) return 'bg-emerald-500'
    if (pct > 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getLocationBadge = (tyre: Tyre) => {
    if (tyre.status === 'MOUNTED') {
      return <Badge variant="mounted">{tyre.vehicle?.reg || 'Mounted'}</Badge>
    }
    if (tyre.status === 'STEPNEY') {
      return <Badge variant="stepney">Stepney: {tyre.stepneyVehicle?.reg || ''}</Badge>
    }
    if (tyre.location) {
      return (
        <Badge variant={tyre.location.type === 'GODOWN' ? 'godown' : 'retreader'}>
          {tyre.location.name}
        </Badge>
      )
    }
    return <Badge variant="inventory">Inventory</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({tyres?.length || 0})
          </Button>
          {STATUSES.map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()} (
              {tyres?.filter((t) => t.status === status).length || 0})
            </Button>
          ))}
        </div>
        <Button onClick={() => { resetForm(); setEditingTyre(null); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tyre
        </Button>
      </div>

      {/* Search & Location Filter */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by serial or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="all">All Locations</option>
          <option value="mounted">Mounted on Vehicles</option>
          {locations?.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.type})
            </option>
          ))}
          <option value="none">No Location</option>
        </select>
      </div>

      {/* Tyres Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Serial
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Brand
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Size
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tread
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Location
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tyres?.map((tyre) => {
                const treadPct = tyre.initialTread > 0
                  ? Math.round((tyre.currentTread / tyre.initialTread) * 100)
                  : 100
                return (
                  <tr key={tyre.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {tyre.serial}
                    </td>
                    <td className="px-4 py-3 text-sm">{tyre.brand}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{tyre.size}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getTreadColor(tyre.currentTread, tyre.initialTread)}`}
                            style={{ width: `${treadPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {tyre.currentTread}mm
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={tyre.status.toLowerCase() as any}>
                        {tyre.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{getLocationBadge(tyre)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(tyre)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {(tyre.status === 'INVENTORY' || tyre.status === 'WORN' || tyre.status === 'REPAIR') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this tyre?')) {
                                deleteMutation.mutate(tyre.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(!tyres || tyres.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No tyres found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tyre Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTyre ? 'Edit Tyre' : 'Add Tyre'}
            </DialogTitle>
            <DialogDescription>
              {editingTyre ? 'Update tyre details and photos.' : 'Enter new tyre details and upload photos.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Serial Number
                </label>
                <Input
                  value={formData.serial}
                  onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                  placeholder="SN-2024-001"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Brand
                </label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Size
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Pattern
                </label>
                <Input
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  placeholder="Highway"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Purchase Date
                </label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Cost (₹)
                </label>
                <Input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="28000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Initial Tread (mm)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.initialTread}
                  onChange={(e) => setFormData({ ...formData, initialTread: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Current Tread (mm)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.currentTread}
                  onChange={(e) => setFormData({ ...formData, currentTread: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Godown
                </label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">— None —</option>
                  {locations?.filter((l) => l.type === 'GODOWN').map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof STATUSES[number] })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-vertical"
              />
            </div>

            {/* Image Upload with Camera */}
            <ImageUpload
              images={capturedImages}
              onImagesChange={setCapturedImages}
              maxImages={5}
              label="Tyre Photos & Documents"
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTyre ? 'Update' : 'Add'} Tyre
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}