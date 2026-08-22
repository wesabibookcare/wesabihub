import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { Wallet, Transaction } from '../../types';
import { BaseRepository } from './BaseRepository';

const walletConverter: FirestoreDataConverter<Wallet> = {
  toFirestore: (wallet: Wallet) => {
    return { ...wallet };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      uid: snapshot.id
    } as Wallet;
  }
};

const transactionConverter: FirestoreDataConverter<Transaction> = {
  toFirestore: (tx: Transaction) => {
    return { ...tx };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as Transaction;
  }
};

class WalletRepository extends BaseRepository<Wallet> {
  constructor() {
    super('wallets', walletConverter);
  }

  async getByUserId(uid: string): Promise<Wallet | null> {
    return this.getById(uid);
  }
}

class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super('transactions', transactionConverter);
  }

  async getByWallet(walletId: string, limitCount: number = 50): Promise<Transaction[]> {
    return this.getAll([
      where('walletId', '==', walletId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ]);
  }
}

export const walletRepository = new WalletRepository();
export const transactionRepository = new TransactionRepository();
