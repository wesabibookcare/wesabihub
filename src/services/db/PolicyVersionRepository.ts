import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { PolicyVersion } from '../../types';
import { BaseRepository } from './BaseRepository';

const policyVersionConverter: FirestoreDataConverter<PolicyVersion> = {
  toFirestore: (data: PolicyVersion) => ({ ...data }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  } as PolicyVersion)
};

class PolicyVersionRepository extends BaseRepository<PolicyVersion> {
  constructor() {
    super('policyVersions', policyVersionConverter);
  }
}

export const policyVersionRepository = new PolicyVersionRepository();
