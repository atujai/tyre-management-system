import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Warehouse, Plus, Pencil, Trash2, Save, X, Phone, MapPin } from 'lucide-react'
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
import type { Location } from '@/types'

export function LocationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'GODOWN' as 'GODOWN' | 'RETREADER',
    address: '',
    contact: '',
  })

  const queryClient = useQueryClient()

  const { data: locations, isLoading } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get('/locations')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/locations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setIsModalOpen(false)
      resetForm()
      toast.success('Location created')
    },
    onError: (error: any) => {
      toast.error('Failed to create', error.response?.data?.error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      api.put(`/locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setIsModalOpen(false)
      setEditingLocation(null)
      resetForm()
      toast.success('Location updated')
    },
    onError: (error: any) => {
      toast.error('Failed to update', error.response?.data?.error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location deleted')
    },
    onError: (error: any) => {
      toast.error('Failed to delete', error.response?.data?.error)
    },
  })

  const resetForm = () => {
    setFormData({ name: '', type: 'GODOWN', address: '', contact: '' })
  }

  const openEditModal = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      type: location.type,
      address: location.address || '',
      contact: location.contact || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const godowns = locations?.filter((l) => l.type === 'GODOWN') || []
  const retreaders = locations?.filter((l) => l.type === 'RETREADER') || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <p className="text-sm text-muted-foreground">
          {locations?.length || 0} location(s)
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetForm()
              setFormData({ ...formData, type: 'GODOWN' })
              setEditingLocation(null)
              setIsModalOpen(true)
            }}
          >
            <Warehouse className="h-4 w-4 mr-2" />
            Add Godown
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              setFormData({ ...formData, type: 'RETREADER' })
              setEditingLocation(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Retreader
          </Button>
        </div>
      </div>

      {/* Godowns */}
      <div>
        <h3 className="font-heading font-bold text-lg text-sky-400 mb-4 flex items-center gap-2">
          <Warehouse className="h-5 w-5" />
          Godowns
        </h3>
        {godowns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {godowns.map((location) => (
              <Card key={location.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                      <Warehouse className="h-5 w-5 text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-foreground">{location.name}</h4>
                          {location.address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {location.address}
                            </p>
                          )}
                          {location.contact && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {location.contact}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(location)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this location?')) {
                                deleteMutation.mutate(location.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Badge variant="inventory" className="mt-3">
                        {location._count?.tyres || 0} in stock
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            No godowns added yet
          </Card>
        )}
      </div>

      {/* Retreaders */}
      <div>
        <h3 className="font-heading font-bold text-lg text-orange-400 mb-4 flex items-center gap-2">
          <Warehouse className="h-5 w-5" />
          Retreaders
        </h3>
        {retreaders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {retreaders.map((location) => (
              <Card key={location.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Warehouse className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-foreground">{location.name}</h4>
                          {location.address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {location.address}
                            </p>
                          )}
                          {location.contact && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {location.contact}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(location)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this location?')) {
                                deleteMutation.mutate(location.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Badge variant="repair" className="mt-3">
                        {location._count?.tyres || 0} for retreading
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            No retreaders added yet
          </Card>
        )}
      </div>

      {/* Location Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Location name"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'GODOWN' | 'RETREADER' })}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="GODOWN">Godown</option>
                <option value="RETREADER">Retreader</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-vertical"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Contact
              </label>
              <Input
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Mr. Sharma - 9838475621"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingLocation ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
