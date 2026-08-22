import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { Advertisement } from '../../types';
import { BaseRepository } from './BaseRepository';

const advertisementConverter: FirestoreDataConverter<Advertisement> = {
  toFirestore: (data: Advertisement) => ({ ...data }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  } as Advertisement)
};

class AdvertisementRepository extends BaseRepository<Advertisement> {
  constructor() {
    super('advertisements', advertisementConverter);
  }
}

export const advertisementRepository = new AdvertisementRepository();
