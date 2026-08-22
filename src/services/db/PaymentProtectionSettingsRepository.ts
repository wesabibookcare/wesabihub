import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { PaymentProtectionSettings } from '../../types';
import { BaseRepository } from './BaseRepository';

const paymentProtectionSettingsConverter: FirestoreDataConverter<PaymentProtectionSettings> = {
  toFirestore: (settings: PaymentProtectionSettings) => {
    return { ...settings };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as PaymentProtectionSettings;
  }
};

class PaymentProtectionSettingsRepository extends BaseRepository<PaymentProtectionSettings> {
  constructor() {
    super('paymentProtectionSettings', paymentProtectionSettingsConverter);
  }

  async getSettings(): Promise<PaymentProtectionSettings> {
    const settings = await this.getById('default');
    if (settings) return settings;

    // Default fallback if not found
    return {
        id: 'default',
        defaultInspectionPeriodHours: 48,
        maxExtensionHours: 24,
        allowInspectionExtension: true,
        autoReleaseAfterInspection: true,
        supportedPaymentProviders: ['FLUTTERWAVE'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
  }

  async updateSettings(data: Partial<PaymentProtectionSettings>): Promise<void> {
    const settings = await this.getSettings();
    await this.update(settings.id, { ...settings, ...data, updatedAt: new Date().toISOString() });
  }
}

export const paymentProtectionSettingsRepository = new PaymentProtectionSettingsRepository();
