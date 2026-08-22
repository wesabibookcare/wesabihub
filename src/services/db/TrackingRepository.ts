import { FirestoreDataConverter, QueryDocumentSnapshot, where, query, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TrackingEvent } from '../../types';
import { BaseRepository } from './BaseRepository';

const trackingConverter: FirestoreDataConverter<TrackingEvent> = {
  toFirestore: (event: TrackingEvent) => {
    return { ...event };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as TrackingEvent;
  }
};

class TrackingRepository extends BaseRepository<TrackingEvent> {
  constructor() {
    super('trackingEvents', trackingConverter);
  }

  async getByParcel(parcelId: string): Promise<TrackingEvent[]> {
    try {
      const events = await this.getAll([
        where('parcelId', '==', parcelId)
      ]);
      return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (err) {
      console.error('Failed to fetch tracking events by parcel:', err);
      return [];
    }
  }

  async getLatestEvent(parcelId: string): Promise<TrackingEvent | null> {
    const events = await this.getByParcel(parcelId);
    return events.length > 0 ? events[events.length - 1] : null;
  }

  subscribeToParcelEvents(parcelId: string, callback: (events: TrackingEvent[]) => void) {
    const q = query(
      collection(db, 'trackingEvents').withConverter(trackingConverter),
      where('parcelId', '==', parcelId)
    );
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => doc.data());
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(events);
    }, (err) => {
      console.error('Error listening to parcel tracking events:', err);
    });
  }
}

export const trackingRepository = new TrackingRepository();
