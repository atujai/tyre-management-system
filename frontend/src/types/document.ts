export type DocumentType = 'RC' | 'INSURANCE' | 'PUC' | 'FITNESS' | 'PERMIT' | 'ROAD_TAX' | 'NOC' | 'LICENSE' | 'TAX' | 'OTHER'
export type DocumentStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNDER_RENEWAL' | 'RENEWAL_PENDING' | 'PENDING' | 'ARCHIVED'

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  RC: 'Registration Certificate',
  INSURANCE: 'Insurance Policy',
  PUC: 'Pollution Certificate (PUC)',
  FITNESS: 'Fitness Certificate',
  PERMIT: 'Permit',
  ROAD_TAX: 'Road Tax',
  NOC: 'No Objection Certificate',
  LICENSE: 'Driver License',
  TAX: 'Tax Receipt',
  OTHER: 'Other Document',
}

export const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  RC: 'bg-blue-500', INSURANCE: 'bg-green-500', PUC: 'bg-cyan-500',
  FITNESS: 'bg-orange-500', PERMIT: 'bg-purple-500', ROAD_TAX: 'bg-yellow-500',
  NOC: 'bg-pink-500', LICENSE: 'bg-indigo-500', TAX: 'bg-amber-500', OTHER: 'bg-gray-500',
}

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-500' },
  EXPIRED: { label: 'Expired', color: 'bg-red-500' },
  EXPIRING_SOON: { label: 'Expiring Soon', color: 'bg-yellow-500' },
  UNDER_RENEWAL: { label: 'Under Renewal', color: 'bg-orange-500' },
  RENEWAL_PENDING: { label: 'Renewal Pending', color: 'bg-orange-600' },
  PENDING: { label: 'Pending', color: 'bg-blue-500' },
  ARCHIVED: { label: 'Archived', color: 'bg-gray-500' },
}