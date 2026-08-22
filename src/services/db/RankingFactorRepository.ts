import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { RankingFactor } from '../../types';
import { BaseRepository } from './BaseRepository';

const rankingFactorConverter: FirestoreDataConverter<RankingFactor> = {
  toFirestore: (factor: RankingFactor) => {
    return { ...factor };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as RankingFactor;
  }
};

class RankingFactorRepository extends BaseRepository<RankingFactor> {
  constructor() {
    super('wesabiRankingFactors', rankingFactorConverter);
  }
}

export const rankingFactorRepository = new RankingFactorRepository();
