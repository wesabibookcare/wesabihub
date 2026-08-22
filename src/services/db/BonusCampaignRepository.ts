import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { BonusCampaign } from '../../types';
import { BaseRepository } from './BaseRepository';

const bonusCampaignConverter: FirestoreDataConverter<BonusCampaign> = {
  toFirestore: (campaign: BonusCampaign) => {
    return { ...campaign };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as BonusCampaign;
  }
};

class BonusCampaignRepository extends BaseRepository<BonusCampaign> {
  constructor() {
    super('wesabiBonusCampaigns', bonusCampaignConverter);
  }

  async getActiveCampaigns(): Promise<BonusCampaign[]> {
    return this.getAll([where('isActive', '==', true)]);
  }
}

export const bonusCampaignRepository = new BonusCampaignRepository();
