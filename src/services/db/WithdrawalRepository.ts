import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { WithdrawalRequest } from '../../types';
import { BaseRepository } from './BaseRepository';

const withdrawalConverter: FirestoreDataConverter<WithdrawalRequest> = {
  toFirestore: (withdrawal: WithdrawalRequest) => {
    return { ...withdrawal };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as WithdrawalRequest;
  }
};

class WithdrawalRepository extends BaseRepository<WithdrawalRequest> {
  constructor() {
    super('withdrawalRequests', withdrawalConverter);
  }

  async getByUserId(userId: string, limitCount = 50): Promise<WithdrawalRequest[]> {
    return this.getAll([
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  }

  async getPendingWithdrawals(limitCount = 50): Promise<WithdrawalRequest[]> {
    return this.getAll([
      where('status', '==', 'PENDING'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  }
}

export const withdrawalRepository = new WithdrawalRepository();
