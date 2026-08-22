import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { RoleApplicationConfig } from '../../types';
import { BaseRepository } from './BaseRepository';

const roleApplicationConfigConverter: FirestoreDataConverter<RoleApplicationConfig> = {
  toFirestore: (config: RoleApplicationConfig) => {
    return { ...config };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as RoleApplicationConfig;
  }
};

class RoleApplicationConfigRepository extends BaseRepository<RoleApplicationConfig> {
  constructor() {
    super('roleApplicationConfigs', roleApplicationConfigConverter);
  }

  async getByRole(role: string): Promise<RoleApplicationConfig | null> {
    const configs = await this.query([{ field: 'role', operator: '==', value: role }]);
    return configs.length > 0 ? configs[0] : null;
  }
}

export const roleApplicationConfigRepository = new RoleApplicationConfigRepository();
