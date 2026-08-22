import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { DeveloperProfile } from '../../types';
import { BaseRepository } from './BaseRepository';

const developerProfileConverter: FirestoreDataConverter<DeveloperProfile> = {
  toFirestore: (profile: DeveloperProfile) => {
    const { ...data } = profile;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as DeveloperProfile;
  }
};

class DeveloperProfileRepository extends BaseRepository<DeveloperProfile> {
  constructor() {
    // IMPORTANT: This must match the collection name checked by
    // authenticateApiKey() in server.ts ('developerProfiles', no
    // underscore). A previous mismatch here ('developer_profiles') meant
    // every API key ever generated through the Developer Portal was
    // invisible to the server and would always fail authentication.
    super('developerProfiles', developerProfileConverter);
  }
}

export const developerProfileRepository = new DeveloperProfileRepository();
