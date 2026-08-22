import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { Vehicle } from '../../types/logistics';
import { BaseRepository } from './BaseRepository';

const vehicleConverter: FirestoreDataConverter<Vehicle> = {
  toFirestore: (vehicle: Vehicle) => {
    return { ...vehicle };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as Vehicle;
  }
};

class VehicleRepository extends BaseRepository<Vehicle> {
  constructor() {
    super('vehicles', vehicleConverter);
  }
}

export const vehicleRepository = new VehicleRepository();
