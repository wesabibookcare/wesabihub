import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { Shift } from '../../types';
import { BaseRepository } from './BaseRepository';

const shiftConverter: FirestoreDataConverter<Shift> = {
  toFirestore: (shift: Shift) => {
    return JSON.parse(JSON.stringify(shift));
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as Shift;
  }
};

class ShiftRepository extends BaseRepository<Shift> {
  constructor() {
    super('shifts', shiftConverter);
  }

  /**
   * Get active shift for a staff member
   */
  async getActiveShiftByStaff(staffId: string): Promise<Shift | null> {
    const activeShifts = await this.getAll([
      where('staffId', '==', staffId),
      where('status', '==', 'ACTIVE'),
      limit(1)
    ]);
    return activeShifts.length > 0 ? activeShifts[0] : null;
  }

  /**
   * Get active shifts for a hub
   */
  async getActiveShiftsByHub(hubId: string): Promise<Shift[]> {
    return this.getAll([
      where('hubId', '==', hubId),
      where('status', '==', 'ACTIVE')
    ]);
  }

  /**
   * Get all shifts for a hub
   */
  async getShiftsByHub(hubId: string, limitCount: number = 100): Promise<Shift[]> {
    return this.getAll([
      where('hubId', '==', hubId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  }

  /**
   * Get shift history for a staff member
   */
  async getShiftsByStaff(staffId: string, limitCount: number = 100): Promise<Shift[]> {
    return this.getAll([
      where('staffId', '==', staffId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  }

  /**
   * Realtime listener for Hub active shifts
   */
  subscribeToHubShifts(hubId: string, callback: (shifts: Shift[]) => void) {
    return this.subscribeToQuery([
      where('hubId', '==', hubId),
      orderBy('createdAt', 'desc'),
      limit(100)
    ], callback);
  }

  /**
   * Realtime listener for staff member active & past shifts
   */
  subscribeToStaffShifts(staffId: string, callback: (shifts: Shift[]) => void) {
    return this.subscribeToQuery([
      where('staffId', '==', staffId),
      orderBy('createdAt', 'desc'),
      limit(50)
    ], callback);
  }
}

export const shiftRepository = new ShiftRepository();
