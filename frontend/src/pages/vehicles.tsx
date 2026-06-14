import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, Plus, Pencil, Trash2, Save, X, Eye, Settings } from 'lucide-react'
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
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Vehicle } from '@/types'

// ─── Simple Custom Tabs ───
function SimpleTabs({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return <div>{children}</div>
}

function SimpleTabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap gap-1 bg-secondary/50 p-1 rounded-lg h-auto", className)}>{children}</div>
}

function SimpleTabsTrigger({ value, children, isActive, onClick }: { value: string; children: React.ReactNode; isActive: boolean; onClick: (v: string) => void }) {
  return (
    <button type="button" onClick={() => onClick(value)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  )
}

// ─── Types ───
interface Make {
  id: string
  name: string
}

interface VehicleType {
  id: string
  name: string
}

// ─── Vehicles Page ───
export function VehiclesPage() {
  const queryClient = useQueryClient()

  // ─── State ───
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null)
  const [activeType, setActiveType] = useState<string>('All')

  // Make management
  const [isMakeModalOpen, setIsMakeModalOpen] = useState(false)
  const [makeForm, setMakeForm] = useState({ name: '' })
  const [editingMake, setEditingMake] = useState<Make | null>(null)

  // Type management
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
  const [typeForm, setTypeForm] = useState({ name: '' })
  const [editingType, setEditingType] = useState<VehicleType | null>(null)

  // Vehicle form
  const [formData, setFormData] = useState({
    reg: '',
    type: '',
    make: '',
    model: '',
    stepneySlots: 1,
    axles: [{ tyreCount: 2, steering: true, drive: false, line: null as number | null }],
  })

  // ─── Queries ───
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const response = await api.get('/vehicles')
      return response.data
    },
  })

  const { data: makes, isLoading: makesLoading } = useQuery<Make[]>({
    queryKey: ['makes'],
    queryFn: async () => {
      const response = await api.get('/makes')
      return response.data
    },
  })

  const { data: vehicleTypes, isLoading: typesLoading } = useQuery<VehicleType[]>({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const response = await api.get('/vehicle-types')
      return response.data
    },
  })

  // ─── Mutations: Makes ───
  const createMakeMutation = useMutation({
    mutationFn: (data: { name: string }) => api.post('/makes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['makes'] })
      setMakeForm({ name: '' })
      toast.success('Make added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add make')
    },
  })

  const updateMakeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) => api.put(`/makes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['makes'] })
      setEditingMake(null)
      setMakeForm({ name: '' })
      toast.success('Make updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update make')
    },
  })

  const deleteMakeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/makes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['makes'] })
      toast.success('Make deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete make')
    },
  })

  // ─── Mutations: Vehicle Types ───
  const createTypeMutation = useMutation({
    mutationFn: (data: { name: string }) => api.post('/vehicle-types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] })
      setTypeForm({ name: '' })
      toast.success('Vehicle type added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add vehicle type')
    },
  })

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) => api.put(`/vehicle-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] })
      setEditingType(null)
      setTypeForm({ name: '' })
      toast.success('Vehicle type updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update vehicle type')
    },
  })

  const deleteTypeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicle-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] })
      toast.success('Vehicle type deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete vehicle type')
    },
  })

  // ─── Mutations: Vehicles ───
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setIsModalOpen(false)
      resetForm()
      toast.success('Vehicle created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create vehicle')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => api.put(`/vehicles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setIsModalOpen(false)
      setEditingVehicle(null)
      resetForm()
      toast.success('Vehicle updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update vehicle')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Vehicle deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete vehicle')
    },
  })

  // ─── Helpers ───
  const resetForm = () => {
    setFormData({
      reg: '',
      type: vehicleTypes?.[0]?.name || '',
      make: makes?.[0]?.name || '',
      model: '',
      stepneySlots: 1,
      axles: [{ tyreCount: 2, steering: true, drive: false, line: null }],
    })
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      reg: vehicle.reg,
      type: vehicle.type,
      make: (vehicle as any).make || '',
      model: vehicle.model,
      stepneySlots: vehicle.stepneySlots,
      axles: vehicle.axles.map((a) => ({
        tyreCount: a.tyreCount,
        steering: a.steering,
        drive: a.drive,
        line: a.line,
      })),
    })
    setIsModalOpen(true)
  }

  const openViewModal = (vehicle: Vehicle) => {
    setViewingVehicle(vehicle)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const addAxle = () => {
    const isGoldhofer = formData.type === 'Goldhofer'
    const lastLine = formData.axles[formData.axles.length - 1]?.line || 0
    setFormData({
      ...formData,
      axles: [
        ...formData.axles,
        {
          tyreCount: isGoldhofer ? 8 : 4,
          steering: false,
          drive: false,
          line: isGoldhofer ? lastLine + 1 : null,
        },
      ],
    })
  }

  const removeAxle = (index: number) => {
    if (formData.axles.length <= 1) return
    setFormData({ ...formData, axles: formData.axles.filter((_, i) => i !== index) })
  }

  const updateAxle = (index: number, field: string, value: any) => {
    const newAxles = [...formData.axles]
    newAxles[index] = { ...newAxles[index], [field]: value }
    setFormData({ ...formData, axles: newAxles })
  }

  // Initialize form defaults when makes/types load
  useEffect(() => {
    if (makes?.length && !formData.make) {
      setFormData(prev => ({ ...prev, make: makes[0].name }))
    }
    if (vehicleTypes?.length && !formData.type) {
      setFormData(prev => ({ ...prev, type: vehicleTypes[0].name }))
    }
  }, [makes, vehicleTypes])

  const filteredVehicles = activeType === 'All'
    ? vehicles
    : vehicles?.filter((v) => v.type === activeType)

  const typeCounts = (vehicleTypes || []).reduce((acc, vt) => {
    acc[vt.name] = vehicles?.filter((v) => v.type === vt.name).length || 0
    return acc
  }, {} as Record<string, number>)

  const isLoading = vehiclesLoading || makesLoading || typesLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Settings */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Vehicles</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsMakeModalOpen(true)}>
            <Settings className="h-3 w-3 mr-1" />
            Manage Makes
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsTypeModalOpen(true)}>
            <Settings className="h-3 w-3 mr-1" />
            Manage Types
          </Button>
          <Button onClick={() => { resetForm(); setEditingVehicle(null); setIsModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SimpleTabs value={activeType} onValueChange={setActiveType}>
          <SimpleTabsList className="flex-wrap h-auto gap-1">
            <SimpleTabsTrigger value="All" isActive={activeType === 'All'} onClick={setActiveType}>
              All <span className="ml-1 text-muted-foreground">({vehicles?.length || 0})</span>
            </SimpleTabsTrigger>
            {(vehicleTypes || []).map((vt) => (
              <SimpleTabsTrigger key={vt.id} value={vt.name} isActive={activeType === vt.name} onClick={setActiveType}>
                {vt.name} <span className="ml-1 text-muted-foreground">({typeCounts[vt.name] || 0})</span>
              </SimpleTabsTrigger>
            ))}
          </SimpleTabsList>
        </SimpleTabs>
      </div>

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles?.map((vehicle) => (
          <Card key={vehicle.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-xl text-foreground">{vehicle.reg}</h3>
                    <Badge variant="secondary" className="text-[10px]">{vehicle.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(vehicle as any).make ? `${(vehicle as any).make} — ` : ''}{vehicle.model}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openViewModal(vehicle)} title="View Details">
                    <Eye className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditModal(vehicle)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this vehicle?')) deleteMutation.mutate(vehicle.id) }} title="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-heading font-bold text-primary">{vehicle.axles.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Axles</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-heading font-bold text-emerald-400">{vehicle.mountedCount}/{vehicle.totalTyres}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Mounted</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-heading font-bold text-purple-400">{vehicle.stepneyCount}/{vehicle.stepneySlots}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Stepney</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No vehicles found for this type.</p>
        </div>
      )}

      {/* ─── Vehicle Form Modal ─── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Registration</label>
                <Input value={formData.reg} onChange={(e) => setFormData({ ...formData, reg: e.target.value })} placeholder="TRK-001" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Model</label>
                <Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="FH 500" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Make</label>
                <select
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select Make</option>
                  {(makes || []).map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value
                    setFormData({
                      ...formData,
                      type,
                      axles: type === 'Goldhofer'
                        ? [{ tyreCount: 8, steering: false, drive: false, line: 1 }]
                        : [{ tyreCount: 2, steering: true, drive: false, line: null }],
                    })
                  }}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select Type</option>
                  {(vehicleTypes || []).map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Stepney Slots</label>
                <Input type="number" min={0} max={10} value={formData.stepneySlots} onChange={(e) => setFormData({ ...formData, stepneySlots: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Axles</label>
                <Button type="button" variant="outline" size="sm" onClick={addAxle}>
                  <Plus className="h-3 w-3 mr-1" /> Add Axle
                </Button>
              </div>
              <div className="space-y-2">
                {formData.axles.map((axle, i) => (
                  <div key={i} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                    <span className="text-sm font-bold text-primary w-16">Axle {i + 1}</span>
                    <div>
                      <label className="text-[10px] text-muted-foreground block">Tyres</label>
                      <select value={axle.tyreCount} onChange={(e) => updateAxle(i, 'tyreCount', parseInt(e.target.value))} className="w-16 h-8 rounded border border-border bg-background text-sm">
                        {[2, 4, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    {formData.type !== 'Goldhofer' ? (
                      <>
                        <label className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={axle.steering} onChange={(e) => updateAxle(i, 'steering', e.target.checked)} className="rounded" />
                          <span className="text-xs">Steer</span>
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={axle.drive} onChange={(e) => updateAxle(i, 'drive', e.target.checked)} className="rounded" />
                          <span className="text-xs">Drive</span>
                        </label>
                      </>
                    ) : (
                      <div>
                        <label className="text-[10px] text-muted-foreground block">Line</label>
                        <Input type="number" min={1} value={axle.line || ''} onChange={(e) => updateAxle(i, 'line', parseInt(e.target.value) || null)} className="w-16 h-8" />
                      </div>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAxle(i)} disabled={formData.axles.length <= 1} className="ml-auto">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" /> {editingVehicle ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── View Vehicle Modal ─── */}
      <Dialog open={!!viewingVehicle} onOpenChange={() => setViewingVehicle(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <span>{viewingVehicle?.reg}</span>
                  <Badge variant="secondary">{viewingVehicle?.type}</Badge>
                </div>
                <p className="text-sm font-normal text-muted-foreground">
                  {(viewingVehicle as any)?.make ? `${(viewingVehicle as any).make} — ` : ''}{viewingVehicle?.model}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {viewingVehicle && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-heading font-bold text-primary">{viewingVehicle.axles.length}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-1">Axles</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-heading font-bold text-emerald-400">{viewingVehicle.totalTyres}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-1">Total Tyres</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-heading font-bold text-blue-400">{viewingVehicle.mountedCount}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-1">Mounted</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-heading font-bold text-purple-400">{viewingVehicle.stepneyCount}/{viewingVehicle.stepneySlots}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-1">Stepney</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Axle Configuration</h4>
                <div className="space-y-2">
                  {viewingVehicle.axles.map((axle, i) => (
                    <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-primary w-16">Axle {i + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{axle.tyreCount}</span>
                          <span className="text-xs text-muted-foreground">tyres</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {axle.steering && <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">Steering</Badge>}
                        {axle.drive && <Badge variant="outline" className="text-xs border-emerald-400 text-emerald-400">Drive</Badge>}
                        {axle.line && <Badge variant="outline" className="text-xs border-orange-400 text-orange-400">Line {axle.line}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Tyre Positions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Array.from({ length: viewingVehicle.totalTyres }).map((_, i) => (
                    <div key={i} className="bg-secondary/30 rounded-lg p-2 text-center text-xs">Position {i + 1}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingVehicle(null)}>Close</Button>
            <Button onClick={() => { setViewingVehicle(null); if (viewingVehicle) openEditModal(viewingVehicle) }}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Manage Makes Modal ─── */}
      <Dialog open={isMakeModalOpen} onOpenChange={setIsMakeModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Makes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add/Edit Make */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (editingMake) {
                  updateMakeMutation.mutate({ id: editingMake.id, data: { name: makeForm.name } })
                } else {
                  createMakeMutation.mutate({ name: makeForm.name })
                }
              }}
              className="flex gap-2"
            >
              <Input
                value={makeForm.name}
                onChange={(e) => setMakeForm({ name: e.target.value })}
                placeholder="Enter make name (e.g. Volvo, Scania)"
                required
                className="flex-1"
              />
              <Button type="submit" size="sm">
                <Save className="h-4 w-4 mr-1" />
                {editingMake ? 'Update' : 'Add'}
              </Button>
              {editingMake && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingMake(null); setMakeForm({ name: '' }) }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>

            {/* Makes List */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {(makes || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No makes added yet.</p>
              )}
              {(makes || []).map((make) => (
                <div key={make.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                  <span className="text-sm font-medium">{make.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingMake(make); setMakeForm({ name: make.name }) }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (confirm(`Delete make "${make.name}"?`)) deleteMakeMutation.mutate(make.id) }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsMakeModalOpen(false); setEditingMake(null); setMakeForm({ name: '' }) }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Manage Vehicle Types Modal ─── */}
      <Dialog open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Vehicle Types</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add/Edit Type */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (editingType) {
                  updateTypeMutation.mutate({ id: editingType.id, data: { name: typeForm.name } })
                } else {
                  createTypeMutation.mutate({ name: typeForm.name })
                }
              }}
              className="flex gap-2"
            >
              <Input
                value={typeForm.name}
                onChange={(e) => setTypeForm({ name: e.target.value })}
                placeholder="Enter type name (e.g. Truck, Trailer)"
                required
                className="flex-1"
              />
              <Button type="submit" size="sm">
                <Save className="h-4 w-4 mr-1" />
                {editingType ? 'Update' : 'Add'}
              </Button>
              {editingType && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingType(null); setTypeForm({ name: '' }) }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>

            {/* Types List */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {(vehicleTypes || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No vehicle types added yet.</p>
              )}
              {(vehicleTypes || []).map((vt) => (
                <div key={vt.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                  <span className="text-sm font-medium">{vt.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingType(vt); setTypeForm({ name: vt.name }) }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (confirm(`Delete type "${vt.name}"?`)) deleteTypeMutation.mutate(vt.id) }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsTypeModalOpen(false); setEditingType(null); setTypeForm({ name: '' }) }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}