export interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface Vehicle {
  id: string
  reg: string
  type: string
  model: string
  stepneySlots: number
  axles: Axle[]
  totalTyres: number
  mountedCount: number
  stepneyCount: number
  createdAt: string
}

export interface Axle {
  id: string
  vehicleId: string
  tyreCount: number
  steering: boolean
  drive: boolean
  line: number | null
  sortOrder: number
  tyres: Tyre[]
}

export interface Location {
  id: string
  name: string
  type: 'GODOWN' | 'RETREADER'
  address: string | null
  contact: string | null
  _count?: {
    tyres: number
  }
}

export interface Tyre {
  id: string
  serial: string
  brand: string
  size: string
  pattern: string | null
  purchaseDate: string | null
  initialTread: number
  currentTread: number
  status: TyreStatus
  cost: number | null
  remarks: string | null
  withRim: boolean
  vehicleId: string | null
  axleId: string | null
  position: string | null
  mountingDate: string | null
  stepneyVehicleId: string | null
  stepneyDate: string | null
  stepneyType: StepneyType | null
  locationId: string | null
  images: TyreImage[]
  vehicle?: Vehicle | null
  location?: Location | null
  stepneyVehicle?: Vehicle | null
  axle?: Axle | null
}

export type TyreStatus = 
  | 'MOUNTED' 
  | 'INVENTORY' 
  | 'STEPNEY' 
  | 'WORN' 
  | 'DAMAGED' 
  | 'REPAIR' 
  | 'SCRAPPED'

export type StepneyType = 
  | 'READY' 
  | 'BURST' 
  | 'CLAIM' 
  | 'PUNCTURE' 
  | 'RETREAD_CHECKUP'

export interface TyreImage {
  id: string
  tyreId: string
  url: string
  type: 'TYRE' | 'DOCUMENT' | 'SERIAL_NUMBER'
  caption: string | null
  createdAt: string
}

export interface HistoryEntry {
  id: string
  date: string
  action: string
  details: string | null
  tyreId: string
  vehicleId: string | null
  axleIndex: number | null
  position: string | null
  tyre: {
    serial: string
    brand: string
  }
  vehicle: {
    reg: string
    type: string
  } | null
  user: {
    name: string
  } | null
}

export interface DashboardStats {
  counts: {
    vehicles: number
    totalTyres: number
    mounted: number
    inventory: number
    stepney: number
    worn: number
    damaged: number
    repair: number
    scrapped: number
  }
  stepneyBreakdown: {
    stepneyType: StepneyType
    _count: {
      id: number
    }
  }[]
  recentActivity: HistoryEntry[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role: 'ADMIN' | 'STAFF'
}
