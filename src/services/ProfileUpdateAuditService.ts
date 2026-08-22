import { BaseRepository } from './db/BaseRepository';
import { UserRole } from '@/src/types';
import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';

export interface ProfileChangeRecord {
  id: string;
  userId: string;
  userDisplayName?: string;
  userRole?: UserRole;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  authorityId?: string;
  status: 'UNREAD' | 'SEEN';
  changedBy?: string;
  action?: string;
  changes?: any;
}

const profileChangeRecordConverter: FirestoreDataConverter<ProfileChangeRecord> = {
  toFirestore: (data: ProfileChangeRecord) => ({ ...data }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  } as ProfileChangeRecord)
};

class ProfileChangeRecordRepository extends BaseRepository<ProfileChangeRecord> {
  constructor() {
    super('profile_changes', profileChangeRecordConverter);
  }
}

export const profileChangeRecordRepository = new ProfileChangeRecordRepository();

export const profileUpdateAuditService = {
  async logChange(record: any) {
    try {
      await profileChangeRecordRepository.create(Date.now().toString(), {
        ...record,
        timestamp: new Date().toISOString(),
        status: 'UNREAD'
      });
    } catch (e) {
      console.error('Error logging profile change:', e);
    }
  },

  async getChangesForAuthority(authorityId: string) {
    try {
      return await profileChangeRecordRepository.query([
        { field: 'authorityId', operator: '==', value: authorityId },
        { field: 'status', operator: '==', value: 'UNREAD' }
      ]);
    } catch (e) {
      console.error('Error fetching profile changes:', e);
      return [];
    }
  },

  async markChangeAsSeen(id: string) {
    await profileChangeRecordRepository.update(id, { status: 'SEEN' });
  }
};
