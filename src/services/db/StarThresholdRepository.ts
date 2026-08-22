import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { StarThreshold } from '../../types';
import { BaseRepository } from './BaseRepository';

const starThresholdConverter: FirestoreDataConverter<StarThreshold> = {
  toFirestore: (threshold: StarThreshold) => {
    return { ...threshold };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as StarThreshold;
  }
};

class StarThresholdRepository extends BaseRepository<StarThreshold> {
  constructor() {
    super('wesabiStarThresholds', starThresholdConverter);
  }
}

export const starThresholdRepository = new StarThresholdRepository();
