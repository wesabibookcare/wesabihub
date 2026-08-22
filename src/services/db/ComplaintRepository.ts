import { BaseRepository } from './BaseRepository';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, where, orderBy, limit } from 'firebase/firestore';
import { Complaint } from '../../types';

const converter: FirestoreDataConverter<Complaint> = {
  toFirestore: (data: Complaint) => {
    const { id, ...rest } = data;
    return JSON.parse(JSON.stringify(rest));
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    return { id: snapshot.id, ...snapshot.data(options) } as Complaint;
  }
};

export class ComplaintRepository extends BaseRepository<Complaint> {
  constructor() {
    super('complaints', converter);
  }

  async getByUserId(userId: string): Promise<Complaint[]> {
    return this.getAll([where('userId', '==', userId), orderBy('createdAt', 'desc')]);
  }

  async getRecentComplaints(limitCount: number = 50): Promise<Complaint[]> {
    return this.getAll([orderBy('createdAt', 'desc'), limit(limitCount)]);
  }

  async getByStatus(status: Complaint['status']): Promise<Complaint[]> {
    return this.getAll([where('status', '==', status), orderBy('createdAt', 'desc')]);
  }

  async getByPriority(priority: Complaint['priority']): Promise<Complaint[]> {
    return this.getAll([where('priority', '==', priority), orderBy('createdAt', 'desc')]);
  }
}

export const complaintRepository = new ComplaintRepository();
