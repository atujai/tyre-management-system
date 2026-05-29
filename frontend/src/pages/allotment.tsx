import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Truck, ChevronDown, ChevronUp, Zap, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { Vehicle, Tyre, Axle } from '@/types'

// Sortable Tyre Item for Drag & Drop
function SortableTyre({ tyre, isOverlay }: { tyre: Tyre; isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tyre.id, data: { tyre } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const treadPct = tyre.initialTread > 0
    ? Math.round((tyre.currentTread / tyre.initialTread) * 100)
    : 100
  const isWorn = treadPct <= 50
  const isCritical = treadPct <= 25

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative w-14 h-14 rounded-full border-3 flex items-center justify-center cursor-grab
        font-bold text-[9px] select-none transition-all hover:scale-110 hover:z-10
        ${isOverlay ? 'shadow-xl scale-110 z-50' : ''}
        ${isCritical
          ? 'border-red-500 bg-red-500/15 text-red-400'
          : isWorn
            ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400'
            : 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
        }
      `}
    >
      <span className="text-center leading-tight">
        {tyre.serial.split('-').pop()}
      </span>
      {isCritical && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  )
}

// Empty slot (drop target)
function EmptySlot({
  position,
  axleIndex,
  onClick,
  isOver,
}: {
  position: string
  axleIndex: number
  onClick: () => void
  isOver?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`
        w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer
        transition-all hover:border-primary hover:bg-primary/5
        ${isOver ? 'border-primary bg-primary/10 scale-110' : 'border-muted-foreground/30'}
      `}
    >
      <span className="text-muted-foreground text-[10px]">+</span>
      <span className="absolute -bottom-5 text-[9px] text-muted-foreground font-semibold">
        {position}
      </span>
    </div>
  )
}

function getPositionLabels(tc: number): string[] {
  switch (tc) {
    case 1: return ['S']
    case 2: return ['L', 'R']
    case 4: return ['L1', 'L2', 'R1', 'R2']
    case 6: return ['L1', 'L2', 'L3', 'R1', 'R2', 'R3']
    case 8: return ['L1', 'L2', 'L3', 'L4', 'R1', 'R2', 'R3', 'R4']
    default: return Array.from({ length: tc }, (_, i) => `P${i + 1}`)
  }
}

function getSidePositions(tc: number) {
  const labels = getPositionLabels(tc)
  const half = Math.floor(tc / 2)
  return {
    left: labels.slice(0, half),
    right: labels.slice(half),
  }
}

export function AllotmentPage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [activeTyre, setActiveTyre] = useState<Tyre | null>(null)
  const [mountModalOpen, setMountModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ axleId: string; position: string } | null>(null)
  const [unmountModalOpen, setUnmountModalOpen] = useState(false)
  const [selectedMountedTyre, setSelectedMountedTyre] = useState<Tyre | null>(null)

  const queryClient = useQueryClient()

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const response = await api.get('/vehicles')
      return response.data
    },
  })

  const { data: vehicleDetail, isLoading } = useQuery<Vehicle & {
    axles: (Axle & { tyres: Tyre[] })[]
    stepneys: Tyre[]
    tyres: Tyre[]
  }>({
    queryKey: ['vehicle-detail', selectedVehicleId],
    queryFn: async () => {
      if (!selectedVehicleId) return null
      const response = await api.get(`/vehicles/${selectedVehicleId}`)
      return response.data
    },
    enabled: !!selectedVehicleId,
  })

  const { data: availableTyres } = useQuery<Tyre[]>({
    queryKey: ['available-tyres'],
    queryFn: async () => {
      const [inventory, retread] = await Promise.all([
        api.get('/tyres?status=INVENTORY'),
        api.get('/tyres?status=REPAIR'),
      ])
      return [...inventory.data, ...retread.data]
    },
  })

  const mountMutation = useMutation({
    mutationFn: (data: { tyreId: string; vehicleId: string; axleId: string; position: string }) =>
      api.post('/allotment/mount', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-detail'] })
      queryClient.invalidateQueries({ queryKey: ['available-tyres'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setMountModalOpen(false)
      toast.success('Tyre mounted successfully')
    },
    onError: (error: any) => {
      toast.error('Mount failed', error.response?.data?.error)
    },
  })

  const unmountMutation = useMutation({
    mutationFn: (data: { tyreId: string; destination: string; locationId?: string }) =>
      api.post('/allotment/unmount', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-detail'] })
      queryClient.invalidateQueries({ queryKey: ['available-tyres'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setUnmountModalOpen(false)
      toast.success('Tyre unmounted')
    },
    onError: (error: any) => {
      toast.error('Unmount failed', error.response?.data?.error)
    },
  })

  const bulkMountMutation = useMutation({
    mutationFn: (vehicleId: string) => api.post('/allotment/bulk-mount', { vehicleId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-detail'] })
      queryClient.invalidateQueries({ queryKey: ['available-tyres'] })
      toast.success(`${response.data.mountedCount} tyres mounted`)
    },
    onError: (error: any) => {
      toast.error('Bulk mount failed', error.response?.data?.error)
    },
  })

  const unmountAllMutation = useMutation({
    mutationFn: (vehicleId: string) => api.post('/allotment/unmount-all', { vehicleId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-detail'] })
      queryClient.invalidateQueries({ queryKey: ['available-tyres'] })
      toast.success(
        `${response.data.unmountedCount} tyres + ${response.data.stepneyRemovedCount} stepneys removed`
      )
    },
    onError: (error: any) => {
      toast.error('Unmount all failed', error.response?.data?.error)
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const tyre = event.active.data.current?.tyre as Tyre
    if (tyre) setActiveTyre(tyre)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTyre(null)
    const { active, over } = event
    if (!over) return

    const tyre = active.data.current?.tyre as Tyre
    const dropData = over.data.current as any

    if (dropData?.type === 'slot' && tyre) {
      // Check if slot is occupied
      const existingTyre = vehicleDetail?.axles
        .find((a) => a.id === dropData.axleId)
        ?.tyres.find((t) => t.position === dropData.position && t.status === 'MOUNTED')

      if (existingTyre) {
        toast.error('Slot already occupied')
        return
      }

      mountMutation.mutate({
        tyreId: tyre.id,
        vehicleId: selectedVehicleId,
        axleId: dropData.axleId,
        position: dropData.position,
      })
    }
  }

  const handleSlotClick = (axleId: string, position: string) => {
    const existingTyre = vehicleDetail?.axles
      .find((a) => a.id === axleId)
      ?.tyres.find((t) => t.position === position && t.status === 'MOUNTED')

    if (existingTyre) {
      setSelectedMountedTyre(existingTyre)
      setUnmountModalOpen(true)
    } else {
      setSelectedSlot({ axleId, position })
      setMountModalOpen(true)
    }
  }

  const selectedVehicle = vehicles?.find((v) => v.id === selectedVehicleId)

  return (
    <div className="space-y-6">
      {/* Vehicle Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-muted-foreground">Select Vehicle:</label>
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm w-72"
        >
          <option value="">— Choose Vehicle —</option>
          {vehicles?.map((v) => (
            <option key={v.id} value={v.id}>
              {v.reg} ({v.type} — {v.model})
            </option>
          ))}
        </select>
      </div>

      {!selectedVehicleId ? (
        <Card className="p-16 text-center text-muted-foreground">
          <Truck className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a vehicle to view allotment</p>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {/* Vehicle Header */}
            <Card>
              <CardContent className="p-4 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <span className="font-heading font-bold text-2xl text-foreground">
                    {selectedVehicle?.reg}
                  </span>
                  <span className="text-muted-foreground ml-3">
                    {selectedVehicle?.type} — {selectedVehicle?.model}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="mounted">
                    {vehicleDetail?.tyres?.filter((t) => t.status === 'MOUNTED').length || 0}/
                    {vehicleDetail?.axles?.reduce((sum, a) => sum + a.tyreCount, 0) || 0} Mounted
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkMountMutation.mutate(selectedVehicleId)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Fill
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Unmount all tyres from this vehicle?')) {
                        unmountAllMutation.mutate(selectedVehicleId)
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Unmount All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Available Tyres (Draggable) */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                  Available Tyres (Drag to mount)
                </h3>
                <SortableContext items={availableTyres?.map((t) => t.id) || []}>
                  <div className="flex flex-wrap gap-3 min-h-[80px] p-3 bg-secondary/30 rounded-lg">
                    {availableTyres?.map((tyre) => (
                      <SortableTyre key={tyre.id} tyre={tyre} />
                    ))}
                    {(!availableTyres || availableTyres.length === 0) && (
                      <p className="text-muted-foreground text-sm">No available tyres</p>
                    )}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>

            {/* Vehicle Schematic */}
            <Card className="p-6">
              <div className="text-center mb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">
                  ← Left | Right →
                </span>
              </div>

              <div className="space-y-6">
                {/* Group axles by line for Goldhofer */}
                {vehicleDetail?.type === 'Goldhofer' ? (
                  (() => {
                    const lines = [...new Set(vehicleDetail.axles.map((a) => a.line).filter(Boolean))]
                    return lines.map((line) => (
                      <div key={line} className="border border-border rounded-lg p-4">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">
                          Line {line}
                        </h4>
                        <div className="space-y-4">
                          {vehicleDetail.axles
                            .filter((a) => a.line === line)
                            .map((axle, axleIdx) => renderAxle(axle, axleIdx))}
                        </div>
                      </div>
                    ))
                  })()
                ) : (
                  vehicleDetail?.axles?.map((axle, axleIdx) => renderAxle(axle, axleIdx))
                )}
              </div>
            </Card>

            {/* Stepney Area */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Stepney / Spares ({vehicleDetail?.stepneys?.length || 0}/
                  {selectedVehicle?.stepneySlots || 0})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {vehicleDetail?.stepneys?.map((tyre) => (
                    <div
                      key={tyre.id}
                      className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3 cursor-pointer hover:bg-secondary transition-colors"
                      onClick={() => {
                        setSelectedMountedTyre(tyre)
                        setUnmountModalOpen(true)
                      }}
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-purple-400 bg-purple-400/15 flex items-center justify-center">
                        <span className="text-[8px] text-purple-400 font-bold">
                          {tyre.stepneyType?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{tyre.serial}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {tyre.brand} — {tyre.currentTread}mm
                        </p>
                      </div>
                      <Badge variant={tyre.stepneyType?.toLowerCase() as any || 'ready'}>
                        {tyre.stepneyType || 'READY'}
                      </Badge>
                    </div>
                  ))}
                  {/* Empty stepney slots */}
                  {Array.from({
                    length: (selectedVehicle?.stepneySlots || 0) - (vehicleDetail?.stepneys?.length || 0),
                  }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-3 text-center text-muted-foreground text-xs cursor-pointer hover:border-primary hover:text-primary transition-colors"
                    >
                      + Assign Stepney
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <DragOverlay>
            {activeTyre ? <SortableTyre tyre={activeTyre} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Mount Modal - Select from available tyres */}
      <Dialog open={mountModalOpen} onOpenChange={setMountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mount Tyre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a tyre to mount on this position
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {availableTyres?.map((tyre) => (
                <div
                  key={tyre.id}
                  className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => {
                    if (selectedSlot) {
                      mountMutation.mutate({
                        tyreId: tyre.id,
                        vehicleId: selectedVehicleId,
                        axleId: selectedSlot.axleId,
                        position: selectedSlot.position,
                      })
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-[8px] font-bold">
                    {tyre.serial.split('-').pop()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{tyre.serial}</p>
                    <p className="text-xs text-muted-foreground">
                      {tyre.brand} — {tyre.size} — {tyre.currentTread}mm
                    </p>
                  </div>
                  <Badge variant={tyre.status.toLowerCase() as any}>
                    {tyre.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unmount Modal */}
      <Dialog open={unmountModalOpen} onOpenChange={setUnmountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unmount Tyre</DialogTitle>
          </DialogHeader>
          {selectedMountedTyre && (
            <UnmountForm
              tyre={selectedMountedTyre}
              locations={locations || []}
              vehicles={vehicles || []}
              onSubmit={(data) => unmountMutation.mutate(data)}
              onCancel={() => setUnmountModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  function renderAxle(axle: Axle & { tyres: Tyre[] }, axleIdx: number) {
    const sides = getSidePositions(axle.tyreCount)
    const label = axle.steering
      ? 'Steering'
      : axle.drive
        ? 'Drive'
        : ''

    return (
      <div key={axle.id} className="flex items-center justify-center gap-2 relative py-2">
        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold w-20">
          Axle {axleIdx + 1}
          {label && <span className="block text-[9px] text-primary">({label})</span>}
        </span>

        {/* Left side */}
        <div className="flex gap-2 ml-20">
          {sides.left.map((pos) => {
            const tyre = axle.tyres.find(
              (t) => t.position === pos && t.status === 'MOUNTED'
            )
            return tyre ? (
              <div key={pos} className="relative">
                <SortableTyre tyre={tyre} />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground font-semibold">
                  {pos}
                </span>
              </div>
            ) : (
              <div key={pos} className="relative">
                <EmptySlot
                  position={pos}
                  axleIndex={axleIdx}
                  onClick={() => handleSlotClick(axle.id, pos)}
                />
              </div>
            )
          })}
        </div>

        {/* Axle line */}
        <div className="flex-1 max-w-[120px] h-0.5 bg-border relative mx-4">
          <div className="absolute left-0 right-0 top-[-4px] h-[10px] bg-[repeating-linear-gradient(90deg,hsl(var(--border))_0,hsl(var(--border))_6px,transparent_6px,transparent_10px)]" />
        </div>

        {/* Right side */}
        <div className="flex gap-2">
          {sides.right.map((pos) => {
            const tyre = axle.tyres.find(
              (t) => t.position === pos && t.status === 'MOUNTED'
            )
            return tyre ? (
              <div key={pos} className="relative">
                <SortableTyre tyre={tyre} />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground font-semibold">
                  {pos}
                </span>
              </div>
            ) : (
              <div key={pos} className="relative">
                <EmptySlot
                  position={pos}
                  axleIndex={axleIdx}
                  onClick={() => handleSlotClick(axle.id, pos)}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

// Unmount Form Component
function UnmountForm({
  tyre,
  locations,
  vehicles,
  onSubmit,
  onCancel,
}: {
  tyre: Tyre
  locations: any[]
  vehicles: Vehicle[]
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [destination, setDestination] = useState('godown')
  const [locationId, setLocationId] = useState('')
  const [targetVehicleId, setTargetVehicleId] = useState('')
  const [stepneyType, setStepneyType] = useState('READY')
  const [withRim, setWithRim] = useState(true)

  const godowns = locations.filter((l) => l.type === 'GODOWN')
  const retreaders = locations.filter((l) => l.type === 'RETREADER')
  const otherVehicles = vehicles.filter((v) => v.id !== tyre.vehicleId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      tyreId: tyre.id,
      destination,
      locationId: destination === 'godown' || destination === 'retreader' ? locationId : undefined,
      targetVehicleId: destination === 'stepney-other' ? targetVehicleId : undefined,
      stepneyType,
      withRim,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-secondary/30 rounded-lg p-3 text-sm space-y-1">
        <p><span className="text-muted-foreground">Serial:</span> <strong>{tyre.serial}</strong></p>
        <p><span className="text-muted-foreground">Brand:</span> {tyre.brand}</p>
        <p><span className="text-muted-foreground">Tread:</span> {tyre.currentTread}mm</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Destination</label>
        <div className="space-y-2">
          {godowns.length > 0 && (
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
              <input
                type="radio"
                name="destination"
                value="godown"
                checked={destination === 'godown'}
                onChange={(e) => setDestination(e.target.value)}
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">Return to Godown</p>
                <p className="text-xs text-muted-foreground">Back to inventory</p>
              </div>
            </label>
          )}

          {retreaders.length > 0 && (
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
              <input
                type="radio"
                name="destination"
                value="retreader"
                checked={destination === 'retreader'}
                onChange={(e) => setDestination(e.target.value)}
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">Send to Retreader</p>
                <p className="text-xs text-muted-foreground">For retreading/repair</p>
              </div>
            </label>
          )}

          <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
            <input
              type="radio"
              name="destination"
              value="stepney-same"
              checked={destination === 'stepney-same'}
              onChange={(e) => setDestination(e.target.value)}
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">Stepney on Same Vehicle</p>
            </div>
          </label>

          {otherVehicles.length > 0 && (
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
              <input
                type="radio"
                name="destination"
                value="stepney-other"
                checked={destination === 'stepney-other'}
                onChange={(e) => setDestination(e.target.value)}
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">Stepney on Different Vehicle</p>
              </div>
            </label>
          )}

          <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
            <input
              type="radio"
              name="destination"
              value="scrap"
              checked={destination === 'scrap'}
              onChange={(e) => setDestination(e.target.value)}
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">Scrap Tyre</p>
              <p className="text-xs text-muted-foreground">Permanently remove</p>
            </div>
          </label>
        </div>
      </div>

      {/* Conditional fields */}
      {(destination === 'godown') && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
            Godown
          </label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            required
          >
            <option value="">Select godown...</option>
            {godowns.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {destination === 'retreader' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
            Retreader
          </label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            required
          >
            <option value="">Select retreader...</option>
            {retreaders.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {destination === 'stepney-other' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
            Target Vehicle
          </label>
          <select
            value={targetVehicleId}
            onChange={(e) => setTargetVehicleId(e.target.value)}
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            required
          >
            <option value="">Select vehicle...</option>
            {otherVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.reg} ({v.type}) — {v.stepneyCount}/{v.stepneySlots} stepneys
              </option>
            ))}
          </select>
        </div>
      )}

      {(destination === 'stepney-same' || destination === 'stepney-other') && (
        <>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
              Stepney Type
            </label>
            <div className="flex flex-wrap gap-2">
              {['READY', 'BURST', 'CLAIM', 'PUNCTURE', 'RETREAD_CHECKUP'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setStepneyType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    stepneyType === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {type.replace('_', ' ')}
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
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Confirm Unmount</Button>
      </div>
    </form>
  )
}
