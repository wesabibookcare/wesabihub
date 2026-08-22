import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { TrustFactor } from '../../types';
import { BaseRepository } from './BaseRepository';

const trustFactorConverter: FirestoreDataConverter<TrustFactor> = {
  toFirestore: (factor: TrustFactor) => {
    return { ...factor };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as TrustFactor;
  }
};

class TrustFactorRepository extends BaseRepository<TrustFactor> {
  constructor() {
    super('wesabiTrustFactors', trustFactorConverter);
  }
}

export const trustFactorRepository = new TrustFactorRepository();
