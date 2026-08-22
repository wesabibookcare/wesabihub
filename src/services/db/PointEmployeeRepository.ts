import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { PointEmployee } from '../../types';
import { BaseRepository } from './BaseRepository';

const pointEmployeeConverter: FirestoreDataConverter<PointEmployee> = {
  toFirestore: (emp: PointEmployee) => {
    return { ...emp };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as PointEmployee;
  }
};

class PointEmployeeRepository extends BaseRepository<PointEmployee> {
  constructor() {
    super('pointEmployees', pointEmployeeConverter);
  }

  async getByPoint(pointId: string): Promise<PointEmployee[]> {
    return this.getAll([where('pointId', '==', pointId), where('status', '==', 'ACTIVE')]);
  }

  async getByUid(uid: string): Promise<PointEmployee | null> {
    const results = await this.getAll([where('uid', '==', uid)]);
    return results.length > 0 ? results[0] : null;
  }
}

export const pointEmployeeRepository = new PointEmployeeRepository();
