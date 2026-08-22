import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import { SupportTicket } from '@/src/types';

const ticketConverter: FirestoreDataConverter<SupportTicket> = {
  toFirestore: (ticket: SupportTicket) => ({ ...ticket }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  }) as SupportTicket
};

class SupportTicketRepository extends BaseRepository<SupportTicket> {
  constructor() {
    super('support_tickets', ticketConverter);
  }

  async getByUser(userId: string): Promise<SupportTicket[]> {
    if (!userId) return [];
    return this.query([{ field: 'userId', operator: '==', value: userId }]);
  }

  subscribeToAll(callback: (tickets: SupportTicket[]) => void) {
    return this.subscribeToQuery([], callback);
  }

  subscribeToUser(userId: string, callback: (tickets: SupportTicket[]) => void) {
    if (!userId) return () => {};
    return this.subscribeToQuery([], (all) => {
      callback(all.filter(t => t.userId === userId));
    });
  }
}

export const supportTicketRepository = new SupportTicketRepository();
