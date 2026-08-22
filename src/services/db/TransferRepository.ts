import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy } from 'firebase/firestore';
import { ParcelTransfer } from '../../types';
import { BaseRepository } from './BaseRepository';

const transferConverter: FirestoreDataConverter<ParcelTransfer> = {
  toFirestore: (transfer: ParcelTransfer) => {
    return { ...transfer };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as ParcelTransfer;
  }
};

class TransferRepository extends BaseRepository<ParcelTransfer> {
  constructor() {
    super('parcelTransfers', transferConverter);
  }

  async getByParcel(parcelId: string): Promise<ParcelTransfer[]> {
    return this.getAll([
      where('parcelId', '==', parcelId),
      orderBy('timestamp', 'desc')
    ]);
  }

  async getByTransferId(transferId: string): Promise<ParcelTransfer | null> {
    const results = await this.getAll([where('transferId', '==', transferId)]);
    return results.length > 0 ? results[0] : null;
  }
}

export const transferRepository = new TransferRepository();
