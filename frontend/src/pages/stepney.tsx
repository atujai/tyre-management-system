import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleDot, Plus, ArrowRightToBracket, Warehouse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import api from '@/lib/api'
import type { Vehicle, Tyre } from '@/types'

const STEPNEY_TYPES = [
  { key: 'READY', label: 'Ready / Good', color: '#22c55e' },
  { key: 'BURST', label: 'Burst', color: '#ef4444' },
  { key: 'CLAIM', label: 'For Claim', color: '#ec4899' },
  { key: 'PUNCTURE', label: 'Puncture', color: '#eab308' },
  { key: 'RETREAD_CHECKUP', label: 'Retread Checkup', color: '#f97316' },
]

export function StepneyPage() {
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedTyre, setSelectedTyre] = useState<Tyre | null>(null)

  const queryClient = useQueryClient()

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles-stepney'],
    queryFn: async () => {
      const response = await api.get('/vehicles')
      return response.data
    },
  })

  const { data: vehicleDetails } = useQuery({
    queryKey: ['vehicle-stepneys', selectedVehicleId],
    queryFn: async () => {
      if (!selectedVehicleId) return null
      const response = await api.get(`/vehicles/${selectedVehicleId}`)
      return response.data
    },
    enabled: !!selectedVehicleId,
  })

  const { data: availableTyres } = useQuery<Tyre[]>({
    queryKey: ['available-for-stepney'],
    queryFn: async () => {
      const [inventory, repair] = await Promise.all([
        api.get('/tyres?status=INVENTORY'),
        api.get('/tyres?status=REPAIR'),
      ])
      return [...inventory.data, ...repair.data]
    },
  })

  const assignMutation = useMutation({
    mutationFn: (data: { tyreId: string; vehicleId: string; stepneyType: string; withRim: boolean }) =>
      api.post('/allotment/stepney/assign', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-stepney'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-stepneys'] })
      queryClient.invalidateQueries({ queryKey: ['available-for-stepney'] })
      setAssignModalOpen(false)
      setSelectedVehicleId('')
      setSelectedTyre(null)
      toast.success('Stepney assigned')
    },
    onError: (error: any) => {
      toast.error('Assignment failed', error.response?.data?.error)
    },
  })

  const returnMutation = useMutation({
    mutationFn: (tyreId: string) => api.post('/allotment/stepney/return', { tyreId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-stepney'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-stepneys'] })
      toast.success('Returned to inventory')
    },
    onError: (error: any) => {
      toast.error('Return failed', error.response?.data?.error)
    },
  })

  const mountToAxleMutation = useMutation({
    mutationFn: (data: { tyreId: string; axleId: string; position: string }) =>
      api.post('/allotment/stepney/mount', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-stepney'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-stepneys'] })
      toast.success('Mounted on axle')
    },
    onError: (error: any) => {
      toast.error('Mount failed', error.response?.data?.error)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {vehicles?.length || 0} vehicle(s) — click stepney cards to manage
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicles?.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-foreground">
                    {vehicle.reg}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.type} — {vehicle.model}
                  </p>
                </div>
                <Badge variant="stepney">
                  {vehicle.stepneyCount}/{vehicle.stepneySlots}
                </Badge>
              </div>

              {/* Stepney tyres */}
              {vehicle.stepneyCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {vehicle.stepneyCount > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {/* We need to fetch details for each vehicle */}
                      <StepneyList
                        vehicleId={vehicle.id}
                        onReturn={(tyreId) => returnMutation.mutate(tyreId)}
                        onMountToAxle={(data) => mountToAxleMutation.mutate(data)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Empty slots */}
              {vehicle.stepneySlots - vehicle.stepneyCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: vehicle.stepneySlots - vehicle.stepneyCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedVehicleId(vehicle.id)
                        setAssignModalOpen(true)
                      }}
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg px-4 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="h-3 w-3 inline mr-1" />
                      Assign
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 text-xs text-muted-foreground">
                <CircleDot className="h-3 w-3 inline mr-1" />
                {vehicle.mountedCount}/{vehicle.totalTyres} axle positions filled
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Stepney Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Stepney</DialogTitle>
          </DialogHeader>
          <AssignStepneyForm
            vehicleId={selectedVehicleId}
            availableTyres={availableTyres || []}
            onAssign={(data) => assignMutation.mutate(data)}
            onCancel={() => setAssignModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Stepney List Component (fetches per vehicle)
function StepneyList({
  vehicleId,
  onReturn,
  onMountToAxle,
}: {
  vehicleId: string
  onReturn: (tyreId: string) => void
  onMountToAxle: (data: { tyreId: string; axleId: string; position: string }) => void
}) {
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle-stepneys', vehicleId],
    queryFn: async () => {
      const response = await api.get(`/vehicles/${vehicleId}`)
      return response.data
    },
  })

  if (!vehicle?.stepneys?.length) return null

  return (
    <>
      {vehicle.stepneys.map((tyre: Tyre) => {
        const st = STEPNEY_TYPES.find((s) => s.key === tyre.stepneyType) || STEPNEY_TYPES[0]
        return (
          <div
            key={tyre.id}
            className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2 cursor-pointer hover:bg-secondary transition-colors"
            onClick={() => {
              // Show detail modal
            }}
          >
            <div
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: st.color, backgroundColor: `${st.color}18` }}
            >
              <span className="text-[8px] font-bold" style={{ color: st.color }}>
                {st.key.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{tyre.serial}</p>
              <div className="flex items-center gap-1">
                <Badge variant={tyre.stepneyType?.toLowerCase() as any || 'ready'} className="text-[9px]">
                  {tyre.stepneyType?.replace('_', ' ') || 'READY'}
                </Badge>
                {tyre.withRim ? (
                  <span className="text-[9px] text-emerald-400">✓ Rim</span>
                ) : (
                  <span className="text-[9px] text-muted-foreground">✗ No Rim</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

// Assign Stepney Form
function AssignStepneyForm({
  vehicleId,
  availableTyres,
  onAssign,
  onCancel,
}: {
  vehicleId: string
  availableTyres: Tyre[]
  onAssign: (data: { tyreId: string; vehicleId: string; stepneyType: string; withRim: boolean }) => void
  onCancel: () => void
}) {
  const [selectedTyreId, setSelectedTyreId] = useState('')
  const [stepneyType, setStepneyType] = useState('READY')
  const [withRim, setWithRim] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTyreId) {
      toast.error('Please select a tyre')
      return
    }
    onAssign({ tyreId: selectedTyreId, vehicleId, stepneyType, withRim })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
          Select Tyre
        </label>
        <div className="max-h-[250px] overflow-y-auto space-y-2">
          {availableTyres.map((tyre) => (
            <div
              key={tyre.id}
              onClick={() => setSelectedTyreId(tyre.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedTyreId === tyre.id
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-secondary/30 hover:bg-secondary'
              }`}
            >
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-[8px] font-bold">
                {tyre.serial.split('-').pop()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{tyre.serial}</p>
                <p className="text-xs text-muted-foreground">
                  {tyre.brand} — {tyre.currentTread}mm
                </p>
              </div>
              <Badge variant={tyre.status.toLowerCase() as any}>
                {tyre.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
          Stepney Type
        </label>
        <div className="flex flex-wrap gap-2">
          {STEPNEY_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => setStepneyType(type.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                stepneyType === type.key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={withRim}
          onChange={(e) => setWithRim(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm">With Rim</span>
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Assign Stepney</Button>
      </div>
    </form>
  )
}
