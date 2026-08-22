import { BaseRepository } from './BaseRepository';
import { BulkIntakeSession } from '../../types/bulkIntake';
import { FirestoreDataConverter } from 'firebase/firestore';

const bulkIntakeSessionConverter: FirestoreDataConverter<BulkIntakeSession> = {
  toFirestore: (session: BulkIntakeSession) => session,
  fromFirestore: (snapshot) => snapshot.data() as BulkIntakeSession
};

class BulkIntakeSessionRepository extends BaseRepository<BulkIntakeSession> {
  constructor() {
    super('bulk_intake_sessions', bulkIntakeSessionConverter);
  }
}

export const bulkIntakeSessionRepository = new BulkIntakeSessionRepository();
