import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';

export interface CommissionRule {
  id: string;
  platformPercentage: number;
  centrePercentage: number;
  logisticsPercentage: number;
  country: string;
  version: number;
  isActive: boolean;
  createdAt: any;
}

const converter: FirestoreDataConverter<CommissionRule> = {
  toFirestore: (data: CommissionRule) => {
    const { id, ...rest } = data;
    return rest;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as CommissionRule;
  }
};

class CommissionRuleRepository extends BaseRepository<CommissionRule> {
  constructor() {
    super('commissionRules', converter);
  }
}

export const commissionRuleRepository = new CommissionRuleRepository();
