import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { MerchantCustomer } from '../../types';
import { BaseRepository } from './BaseRepository';

const merchantCustomerConverter: FirestoreDataConverter<MerchantCustomer> = {
  toFirestore: (customer: MerchantCustomer) => {
    return JSON.parse(JSON.stringify(customer));
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as MerchantCustomer;
  }
};

class MerchantCustomerRepository extends BaseRepository<MerchantCustomer> {
  constructor() {
    super('merchant_customers', merchantCustomerConverter);
  }

  async getByMerchant(merchantId: string): Promise<MerchantCustomer[]> {
    return this.getAll([where('merchantId', '==', merchantId)]);
  }

  async getByMerchantAndPhone(merchantId: string, phone: string): Promise<MerchantCustomer | null> {
    const results = await this.getAll([
      where('merchantId', '==', merchantId),
      where('phone', '==', phone)
    ]);
    return results.length > 0 ? results[0] : null;
  }
}

export const merchantCustomerRepository = new MerchantCustomerRepository();
