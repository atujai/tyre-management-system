import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { Vehicle } from '@/types'

const VEHICLE_TYPES = ['Truck', 'Trailer', 'Goldhofer', 'Lowbed', 'Flatbed']

export function VehiclesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState({
    reg: '',
    type: 'Truck',
    model: '',
    stepneySlots: 1,
    axles: [{ tyreCount: 2, steering: true, drive: false, line: null as number | null }],
  })

  const queryClient = useQueryClient()

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const response = await api.get('/vehicles')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setIsModalOpen(false)
      resetForm()
      toast.success('Vehicle created successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to create vehicle', error.response?.data?.error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      api.put(`/vehicles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setIsModalOpen(false)
      setEditingVehicle(null)
      resetForm()
      toast.success('Vehicle updated successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to update vehicle', error.response?.data?.error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Vehicle deleted')
    },
    onError: (error: any) => {
      toast.error('Failed to delete vehicle', error.response?.data?.error)
    },
  })

  const resetForm = () => {
    setFormData({
      reg: '',
      type: 'Truck',
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
    setFormData({
      ...formData,
      axles: formData.axles.filter((_, i) => i !== index),
    })
  }

  const updateAxle = (index: number, field: string, value: any) => {
    const newAxles = [...formData.axles]
    newAxles[index] = { ...newAxles[index], [field]: value }
    setFormData({ ...formData, axles: newAxles })
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
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {vehicles?.length || 0} vehicle(s)
        </p>
        <Button onClick={() => { resetForm(); setEditingVehicle(null); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles?.map((vehicle) => (
          <Card key={vehicle.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-foreground">
                    {vehicle.reg}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.type} — {vehicle.model}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(vehicle)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this vehicle?')) {
                        deleteMutation.mutate(vehicle.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-heading font-bold text-primary">
                    {vehicle.axles.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">Axles</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-heading font-bold text-emerald-400">
                    {vehicle.mountedCount}/{vehicle.totalTyres}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">Mounted</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-heading font-bold text-purple-400">
                    {vehicle.stepneyCount}/{vehicle.stepneySlots}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">Stepney</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vehicle Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Registration
                </label>
                <Input
                  value={formData.reg}
                  onChange={(e) => setFormData({ ...formData, reg: e.target.value })}
                  placeholder="TRK-001"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Model
                </label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Volvo FH 500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Type
                </label>
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
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Stepney Slots
                </label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.stepneySlots}
                  onChange={(e) => setFormData({ ...formData, stepneySlots: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Axles
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addAxle}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Axle
                </Button>
              </div>
              <div className="space-y-2">
                {formData.axles.map((axle, i) => (
                  <div key={i} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                    <span className="text-sm font-bold text-primary w-16">
                      Axle {i + 1}
                    </span>
                    <div>
                      <label className="text-[10px] text-muted-foreground block">Tyres</label>
                      <select
                        value={axle.tyreCount}
                        onChange={(e) => updateAxle(i, 'tyreCount', parseInt(e.target.value))}
                        className="w-16 h-8 rounded border border-border bg-background text-sm"
                      >
                        {[2, 4, 6, 8].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    {formData.type !== 'Goldhofer' ? (
                      <>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={axle.steering}
                            onChange={(e) => updateAxle(i, 'steering', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs">Steer</span>
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={axle.drive}
                            onChange={(e) => updateAxle(i, 'drive', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs">Drive</span>
                        </label>
                      </>
                    ) : (
                      <div>
                        <label className="text-[10px] text-muted-foreground block">Line</label>
                        <Input
                          type="number"
                          min={1}
                          value={axle.line || ''}
                          onChange={(e) => updateAxle(i, 'line', parseInt(e.target.value) || null)}
                          className="w-16 h-8"
                        />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAxle(i)}
                      disabled={formData.axles.length <= 1}
                      className="ml-auto"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingVehicle ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
