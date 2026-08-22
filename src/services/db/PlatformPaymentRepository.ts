import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { PlatformPayment } from '../../types';
import { BaseRepository } from './BaseRepository';

const platformPaymentConverter: FirestoreDataConverter<PlatformPayment> = {
  toFirestore: (payment: PlatformPayment) => {
    const { ...data } = payment;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as PlatformPayment;
  }
};

class PlatformPaymentRepository extends BaseRepository<PlatformPayment> {
  constructor() {
    super('platform_payments', platformPaymentConverter);
  }
}

export const platformPaymentRepository = new PlatformPaymentRepository();
