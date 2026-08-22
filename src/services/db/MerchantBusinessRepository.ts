import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { User, MerchantBusiness } from '../../types';
import { BaseRepository } from './BaseRepository';

const merchantBusinessConverter: FirestoreDataConverter<MerchantBusiness> = {
  toFirestore: (bus: MerchantBusiness) => {
    return { ...bus };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as MerchantBusiness;
  }
};

class MerchantBusinessRepository extends BaseRepository<MerchantBusiness> {
  constructor() {
    super('merchantBusinesses', merchantBusinessConverter);
  }

  async getByMerchantId(merchantId: string): Promise<MerchantBusiness[]> {
    return this.getAll([where('merchantId', '==', merchantId)]);
  }

  async getByCountry(country: string): Promise<MerchantBusiness[]> {
    return this.getAll([where('country', '==', country), where('status', '==', 'ACTIVE')]);
  }
}

export const merchantBusinessRepository = new MerchantBusinessRepository();
