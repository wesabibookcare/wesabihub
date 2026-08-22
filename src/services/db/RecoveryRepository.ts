import { BaseRepository } from './BaseRepository';
import { BaseEntity } from '../../types';
import { FirestoreDataConverter } from 'firebase/firestore';

export interface RecoveryRequest extends BaseEntity {
  parcelId: string;
  trackingNumber: string;
  hubId: string;
  hubName: string;
  submittedBy: string;
  submitterName: string;
  reason: 'CUSTOMER_NOT_COLLECTED' | 'CUSTOMER_UNREACHABLE' | 'MAX_STORAGE_EXCEEDED' | 'CUSTOMER_REQUESTED' | 'PLATFORM_INTERVENTION_REQUIRED' | 'OTHER';
  notes?: string;
  holdingDurationDays: number;
  parcelStatus: string;
  storageLocation?: string;
  paymentStatus: string;
  customerNotificationStatus?: string;
  status: 'PENDING_REVIEW' | 'NEEDS_INFORMATION' | 'APPROVED' | 'REJECTED' | 'RECOVERY_IN_PROGRESS' | 'RECOVERED' | 'CLOSED';
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

const recoveryConverter: FirestoreDataConverter<RecoveryRequest> = {
  toFirestore(request: RecoveryRequest) {
    return { ...request };
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as RecoveryRequest;
  }
};

class RecoveryRepository extends BaseRepository<RecoveryRequest> {
  constructor() {
    super('recovery_requests', recoveryConverter);
  }

  async getByHubId(hubId: string): Promise<RecoveryRequest[]> {
    const requests = await this.getAll();
    return requests.filter(r => r.hubId === hubId);
  }

  async getByParcelId(parcelId: string): Promise<RecoveryRequest | null> {
    const requests = await this.getAll();
    const found = requests.find(r => r.parcelId === parcelId && ['PENDING_REVIEW', 'NEEDS_INFORMATION', 'RECOVERY_IN_PROGRESS'].includes(r.status));
    return found || null;
  }
}

export const recoveryRepository = new RecoveryRepository();
