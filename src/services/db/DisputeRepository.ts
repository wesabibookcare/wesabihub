import { BaseRepository } from './BaseRepository';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, where, orderBy } from 'firebase/firestore';
import { Dispute } from '../../types';

const converter: FirestoreDataConverter<Dispute> = {
  toFirestore: (data: Dispute) => {
    const { id, ...rest } = data;
    return JSON.parse(JSON.stringify(rest));
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    return { id: snapshot.id, ...snapshot.data(options) } as Dispute;
  }
};

export class DisputeRepository extends BaseRepository<Dispute> {
  constructor() {
    super('disputes', converter);
  }

  async getByConversation(conversationId: string): Promise<Dispute[]> {
    return this.getAll([where('conversationId', '==', conversationId)]);
  }

  async getByShipment(shipmentId: string): Promise<Dispute[]> {
    return this.getAll([where('shipmentId', '==', shipmentId)]);
  }

  async getByStatus(status: Dispute['status']): Promise<Dispute[]> {
    return this.getAll([where('status', '==', status), orderBy('createdAt', 'desc')]);
  }

  async getActiveDisputesCount(): Promise<number> {
    const disputes = await this.getAll([where('status', 'in', ['OPEN', 'UNDER_REVIEW', 'ESCALATED'])]);
    return disputes.length;
  }
}

export const disputeRepository = new DisputeRepository();
