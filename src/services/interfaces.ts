
import { Parcel, ParcelStatus } from '../types';

/**
 * Interface for the Parcel Service.
 * This will eventually be implemented using Firebase Firestore and Functions.
 */
export interface IParcelService {
  createParcel(data: Partial<Parcel>): Promise<Parcel>;
  getParcelById(id: string): Promise<Parcel | null>;
  updateParcelStatus(id: string, status: ParcelStatus): Promise<void>;
  getParcelsByUser(userId: string): Promise<Parcel[]>;
  searchParcels(query: string): Promise<Parcel[]>;
}

/**
 * Interface for the Pricing Service.
 * Handles server-side calculations for shipping fees.
 */
export interface IPricingService {
  calculateShippingFee(params: {
    originId: string;
    destId: string;
    weightKg: number;
    dimensions: { l: number; w: number; h: number };
    serviceType: string;
  }): Promise<{ amount: number; currency: string; breakdown: any }>;
}

/**
 * Interface for the Notification Service.
 * Triggers push, email, and SMS notifications.
 */
export interface INotificationService {
  sendPushNotification(userId: string, title: string, body: string): Promise<void>;
  sendEmail(userId: string, templateId: string, data: any): Promise<void>;
  sendSMS(phone: string, message: string): Promise<void>;
}
