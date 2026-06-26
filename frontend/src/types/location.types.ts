// types/location.types.ts — COMPLETE MERGED FILE

// ========== BASE LOCATION TYPES ==========

export type LocationType = 'GODOWN' | 'RETREADER';

export type TyreCondition = 
  | 'NEW'
  | 'REPAIR'
  | 'RETREAD'
  | 'WORN'
  | 'SCRAP'
  | 'REJECTED';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TyreSizeCount {
  size: string;
  brand: string;
  pattern: string;
  total: number;
  withRim: number;
  withoutRim: number;
  conditions: Record<TyreCondition, {
    count: number;
    withRim: number;
    withoutRim: number;
  }>;
}

export interface LocationInventory {
  location: Location;
  summary: {
    totalTyres: number;
    totalWithRim: number;
    totalWithoutRim: number;
    byCondition: Record<TyreCondition, number>;
  };
  bySize: TyreSizeCount[];
}

export interface LocationTyreItem {
  id: string;
  serialNumber: string;
  brand: string;
  size: string;
  pattern: string;
  condition: TyreCondition;
  hasRim: boolean;
  rimType?: string;
  currentLocationId: string;
  currentLocation?: Location;
  vehicleId?: string;
  vehicle?: {
    registrationNumber: string;
  };
  position?: string;
  purchaseDate?: string;
  manufacturingDate?: string;
  treadDepth?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== BULK TRANSFER TYPES ==========

export interface TyreTransferItem {
  tyreId: string;
  serialNumber: string;
  brand: string;
  size: string;
  condition: TyreCondition;
  hasRim: boolean;
}

export interface BulkTransferRequest {
  fromLocationId: string;
  toLocationId: string;
  tyreIds: string[];
  reason: TransferReason;
  customReason?: string;
  transferDate: string;
  notes?: string;
  referenceNumber?: string;
}

export type TransferReason = 
  | 'STOCK_TRANSFER'
  | 'RETREAD_SEND'
  | 'RETREAD_RETURN'
  | 'REPAIR_SEND'
  | 'REPAIR_RETURN'
  | 'VEHICLE_FITMENT'
  | 'SCRAP_DISPOSAL'
  | 'OTHER';

export interface TransferHistoryItem {
  id: string;
  fromLocation: Location;
  toLocation: Location;
  tyre: {
    id: string;
    serialNumber: string;
    brand: string;
    size: string;
  };
  reason: TransferReason;
  customReason?: string;
  transferredBy: {
    id: string;
    name: string;
  };
  transferDate: string;
  notes?: string;
  referenceNumber?: string;
  createdAt: string;
}

// ========== ALERT TYPES ==========

export interface StockAlert {
  id: string;
  locationId: string;
  locationName: string;
  size: string;
  brand: string;
  currentStock: number;
  threshold: number;
  severity: 'LOW' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface AlertThreshold {
  id: string;
  locationId: string;
  size: string;
  brand?: string;
  minNewCount: number;
  minRetreadCount: number;
  isActive: boolean;
}

// ========== PDF REPORT TYPES ==========

export interface PDFReportData {
  location: Location;
  generatedAt: string;
  generatedBy: string;
  summary: LocationInventory['summary'];
  bySize: TyreSizeCount[];
  transfersIn: TransferHistoryItem[];
  transfersOut: TransferHistoryItem[];
}
