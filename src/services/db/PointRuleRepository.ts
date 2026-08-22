import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { PointRule } from '../../types';
import { BaseRepository } from './BaseRepository';

const pointRuleConverter: FirestoreDataConverter<PointRule> = {
  toFirestore: (rule: PointRule) => {
    return { ...rule };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as PointRule;
  }
};

class PointRuleRepository extends BaseRepository<PointRule> {
  constructor() {
    super('wesabiPointRules', pointRuleConverter);
  }
}

export const pointRuleRepository = new PointRuleRepository();
