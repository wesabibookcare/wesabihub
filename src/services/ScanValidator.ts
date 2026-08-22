import { Parcel, User } from '../types';
import { shipmentRepository } from './db/ShipmentRepository';

class ScanValidator {
  async validate(
    parcelId: string,
    user: User,
    locationId: string
  ): Promise<{ valid: boolean; message: string; parcel?: Parcel }> {
    const parcel = await shipmentRepository.getById(parcelId);
    if (!parcel) {
      return { valid: false, message: 'Parcel not found' };
    }

    // Role check: Only certain roles can scan
    const authorizedRoles = ['CENTER_STAFF', 'CENTER_OWNER', 'DRIVER', 'SUPER_ADMIN'];
    if (!authorizedRoles.includes(user.role)) {
      return { valid: false, message: 'Unauthorized user role' };
    }

    // Location check (simplistic: check if user is associated with location)
    // This requires business logic integration - for now allow.

    return { valid: true, message: 'Scan valid', parcel };
  }
}

export const scanValidator = new ScanValidator();
