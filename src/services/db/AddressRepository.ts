import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { SavedAddress } from '../../types/customer';
import { BaseRepository } from './BaseRepository';

const addressConverter: FirestoreDataConverter<SavedAddress> = {
  toFirestore: (address: SavedAddress) => {
    return JSON.parse(JSON.stringify(address));

  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as SavedAddress;
  }
};

class AddressRepository extends BaseRepository<SavedAddress> {
  constructor() {
    super('addresses', addressConverter);
  }

  async getByUser(userId: string): Promise<SavedAddress[]> {
    return this.getAll([where('userId', '==', userId)]);
  }

  async setDefault(userId: string, addressId: string): Promise<void> {
    const addresses = await this.getByUser(userId);
    const batch = this.getBatch();

    addresses.forEach(addr => {
      const ref = this.getDocRef(addr.id);
      batch.update(ref, { isDefault: addr.id === addressId });
    });

    await batch.commit();
  }
}

export const addressRepository = new AddressRepository();
