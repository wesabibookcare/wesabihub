import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { TransportJob } from '../../types/logistics';
import { BaseRepository } from './BaseRepository';

const transportJobConverter: FirestoreDataConverter<TransportJob> = {
  toFirestore: (job: TransportJob) => {
    return { ...job };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as TransportJob;
  }
};

class TransportJobRepository extends BaseRepository<TransportJob> {
  constructor() {
    super('transportJobs', transportJobConverter);
  }
}

export const transportJobRepository = new TransportJobRepository();
