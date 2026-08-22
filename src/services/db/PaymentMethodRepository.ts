import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'bank' | 'momo';
  brand: string; // 'Visa', 'Mastercard', 'GTBank', 'MTN', etc.
  number: string; // last 4 digits for cards, masked for accounts
  expiry?: string; // 'MM/YY' for cards
  name: string; // cardholder name / account name
  isDefault: boolean;
  createdAt: string;
}

const paymentMethodConverter: FirestoreDataConverter<PaymentMethod> = {
  toFirestore: (method: PaymentMethod) => {
    return { ...method };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as PaymentMethod;
  }
};

class PaymentMethodRepository extends BaseRepository<PaymentMethod> {
  constructor() {
    super('paymentMethods', paymentMethodConverter);
  }

  async getByUser(userId: string): Promise<PaymentMethod[]> {
    return this.query([{ field: 'userId', operator: '==', value: userId }]);
  }

  async setDefault(userId: string, methodId: string): Promise<void> {
    const all = await this.getByUser(userId);
    for (const m of all) {
      if (m.id === methodId) {
        await this.update(m.id, { isDefault: true });
      } else if (m.isDefault) {
        await this.update(m.id, { isDefault: false });
      }
    }
  }
}

export const paymentMethodRepository = new PaymentMethodRepository();
