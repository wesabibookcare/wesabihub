import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { SystemSettings } from '../../types';
import { BaseRepository } from './BaseRepository';

const settingsConverter: FirestoreDataConverter<SystemSettings> = {
  toFirestore: (set: SystemSettings) => {
    return { ...set };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as SystemSettings;
  }
};

class SystemSettingsRepository extends BaseRepository<SystemSettings> {
  constructor() {
    super('systemSettings', settingsConverter);
  }

  async getGlobalSettings(): Promise<SystemSettings | null> {
    return this.getById('global');
  }

  subscribeToSettings(callback: (settings: SystemSettings | null) => void, errorCallback?: (error: unknown) => void) {
    return this.subscribe('global', callback, errorCallback);
  }
}

export const systemSettingsRepository = new SystemSettingsRepository();
