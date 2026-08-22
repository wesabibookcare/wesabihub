import { BaseRepository } from './BaseRepository';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, where, orderBy, doc, collection, setDoc, query, getDocs } from 'firebase/firestore';
import { Conversation } from '../../types';
import { db } from '../../lib/firebase';

const converter: FirestoreDataConverter<Conversation> = {
  toFirestore: (data: Conversation) => {
    const { id, ...rest } = data;
    return rest;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    return { id: snapshot.id, ...snapshot.data(options) } as Conversation;
  }
};

export class ConversationRepository extends BaseRepository<Conversation> {
  constructor() {
    super('conversations', converter);
  }

  // Fetch all conversations where user is buyer or seller, or in participants list
  async getByParticipant(userId: string): Promise<Conversation[]> {
    // Standard secure fetch from both sides to avoid complex index or composite requirements
    const buyerPromise = this.getAll([where('buyerId', '==', userId)]);
    const sellerPromise = this.getAll([where('sellerId', '==', userId)]);
    const participantsPromise = this.getAll([where('participants', 'array-contains', userId)]);

    const [buyerConvs, sellerConvs, partConvs] = await Promise.all([buyerPromise, sellerPromise, participantsPromise]);

    // Merge, de-duplicate, and sort by lastMessageAt descending
    const merged = [...buyerConvs];
    const seenIds = new Set(merged.map(c => c.id));

    for (const c of sellerConvs) {
      if (!seenIds.has(c.id)) {
        merged.push(c);
        seenIds.add(c.id);
      }
    }

    for (const c of partConvs) {
      if (!seenIds.has(c.id)) {
        merged.push(c);
        seenIds.add(c.id);
      }
    }

    return merged.sort((a, b) => {
      return new Date(b.lastMessageAt || b.createdAt || '').getTime() -
             new Date(a.lastMessageAt || a.createdAt || '').getTime();
    });
  }

  async getByShipment(shipmentId: string): Promise<Conversation | null> {
    const results = await this.getAll([where('shipmentId', '==', shipmentId)]);
    return results.length > 0 ? results[0] : null;
  }

  async getByParcel(parcelId: string): Promise<Conversation | null> {
    const results = await this.getAll([where('parcelId', '==', parcelId)]);
    return results.length > 0 ? results[0] : null;
  }

  // Get conversation related to dispute
  async getByDispute(disputeId: string): Promise<Conversation | null> {
    const results = await this.getAll([where('disputeId', '==', disputeId)]);
    return results.length > 0 ? results[0] : null;
  }

  // Subscribe to participant's conversations in real-time
  subscribeToParticipant(userId: string, callback: (conversations: Conversation[]) => void) {
    // In real-time we can subscribe to query for buyer and seller and combine
    const qBuyer = query(collection(db, 'conversations').withConverter(converter), where('buyerId', '==', userId));
    const qSeller = query(collection(db, 'conversations').withConverter(converter), where('sellerId', '==', userId));
    const qPart = query(collection(db, 'conversations').withConverter(converter), where('participants', 'array-contains', userId));

    let buyerData: Conversation[] = [];
    let sellerData: Conversation[] = [];
    let partData: Conversation[] = [];

    const handleUpdate = () => {
      const merged = [...buyerData];
      const seenIds = new Set(merged.map(c => c.id));
      for (const c of sellerData) {
        if (!seenIds.has(c.id)) {
          merged.push(c);
          seenIds.add(c.id);
        }
      }
      for (const c of partData) {
        if (!seenIds.has(c.id)) {
          merged.push(c);
          seenIds.add(c.id);
        }
      }
      merged.sort((a, b) => {
        return new Date(b.lastMessageAt || b.createdAt || '').getTime() -
               new Date(a.lastMessageAt || a.createdAt || '').getTime();
      });
      callback(merged);
    };

    const unsubBuyer = this.subscribeToQuery([where('buyerId', '==', userId)], (data) => {
      buyerData = data;
      handleUpdate();
    });

    const unsubSeller = this.subscribeToQuery([where('sellerId', '==', userId)], (data) => {
      sellerData = data;
      handleUpdate();
    });

    const unsubPart = this.subscribeToQuery([where('participants', 'array-contains', userId)], (data) => {
      partData = data;
      handleUpdate();
    });

    return () => {
      unsubBuyer();
      unsubSeller();
      unsubPart();
    };
  }
}

export const conversationRepository = new ConversationRepository();
