import { BaseEntity } from '../types';

export type IntakeStatus = 'IN_INTAKE_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ParcelCondition =
  | 'GOOD'
  | 'DAMAGED'
  | 'WET'
  | 'BROKEN_SEAL'
  | 'WRONG_LABEL'
  | 'WRONG_DESTINATION'
  | 'MISSING_ITEMS'
  | 'QUANTITY_MISMATCH'
  | 'TAMPERED_PACKAGE'
  | 'ILLEGAL_GOODS'
  | 'DANGEROUS_GOODS'
  | 'OTHER';

export interface IntakeException {
  parcelId: string;
  trackingNumber?: string;
  condition: ParcelCondition;
  reason: string;
  notes?: string;
  evidenceUrl?: string;
  operatorId: string;
  timestamp: string;
}

export interface IntakeScanItem {
  id: string;
  parcelId: string;
  trackingNumber: string;
  condition: ParcelCondition;
  shelfLocation?: string;
  timestamp: string;
  operatorId: string;
  isDuplicate?: boolean;
  hasException?: boolean;
  exceptionReason?: string;
  notes?: string;
  evidenceUrl?: string;
}

export interface BulkIntakeSession extends BaseEntity {
  hubId: string;
  merchantId: string;
  merchantName?: string;
  shipmentId: string;
  status: IntakeStatus;
  operatorId: string;
  operatorName?: string;
  totalParcels: number;
  processedParcels: string[]; // List of parcel IDs processed
  exceptions: Record<string, IntakeException>; // ParcelID -> IntakeException
  scannedItems?: IntakeScanItem[];
  duplicateScansCount?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface BulkIntakeSummary {
  sessionId: string;
  hubId: string;
  merchantId: string;
  shipmentId: string;
  totalExpected: number;
  acceptedCount: number;
  exceptionCount: number;
  duplicateCount: number;
  unprocessedCount: number;
  completedAt: string;
  operatorId: string;
}
