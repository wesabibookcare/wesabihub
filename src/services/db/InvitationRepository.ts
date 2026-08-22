import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';

export interface StaffInvitation extends Record<string, any> {
  id: string;
  status: string;
}

const invitationConverter: FirestoreDataConverter<any> = {
  toFirestore: (inv: any) => {
    return { ...inv };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as any;
  }
};

class InvitationRepository extends BaseRepository<any> {
  constructor() {
    super('staffInvitations', invitationConverter);
  }

  async getByEmail(email: string): Promise<any[]> {
    return this.query([{ field: 'email', operator: '==', value: email }, { field: 'status', operator: '==', value: 'PENDING' }]);
  }

  async getByHub(hubId: string): Promise<any[]> {
    return this.query([{ field: 'hubId', operator: '==', value: hubId }]);
  }
}

export const invitationRepository = new InvitationRepository();
