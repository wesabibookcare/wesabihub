import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { UserConsent } from '../../types';
import { BaseRepository } from './BaseRepository';

const userConsentConverter: FirestoreDataConverter<UserConsent> = {
  toFirestore: (data: UserConsent) => JSON.parse(JSON.stringify(data)),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  } as UserConsent)
};

class UserConsentRepository extends BaseRepository<UserConsent> {
  constructor() {
    super('userConsents', userConsentConverter);
  }
}

export const userConsentRepository = new UserConsentRepository();
