import { FirestoreDataConverter, QueryDocumentSnapshot, where, limit } from 'firebase/firestore';
import { PricingRule } from '../../types';
import { BaseRepository } from './BaseRepository';

const pricingConverter: FirestoreDataConverter<PricingRule> = {
  toFirestore: (rule: PricingRule) => {
    return { ...rule };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as PricingRule;
  }
};

class PricingRuleRepository extends BaseRepository<PricingRule> {
  constructor() {
    super('pricingRules', pricingConverter);
  }

  async getActiveRuleByCountry(country: string): Promise<PricingRule | null> {
    const results = await this.getAll([
      where('country', '==', country),
      where('isActive', '==', true),
      limit(1)
    ]);
    return results.length > 0 ? results[0] : null;
  }

  async getRuleByVersion(country: string, version: number): Promise<PricingRule | null> {
    const results = await this.getAll([
      where('country', '==', country),
      where('version', '==', version),
      limit(1)
    ]);
    return results.length > 0 ? results[0] : null;
  }
}

export const pricingRuleRepository = new PricingRuleRepository();
