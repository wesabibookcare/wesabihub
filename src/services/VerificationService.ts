
import { shipmentRepository } from './db/ShipmentRepository';

export const verificationService = {
  async verifyPickup(parcelId: string, verificationCode: string) {
    const parcel = await shipmentRepository.getById(parcelId);
    if (!parcel || parcel.verificationToken !== verificationCode) {
      return false;
    }
    // Logic to mark as verified and expire code
    return true;
  }
};
