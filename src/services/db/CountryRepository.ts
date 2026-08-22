import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { Country } from '../../types';
import { FALLBACK_COUNTRIES, NIGERIA_STATES } from '../../data/fallbackGeography';
import { BaseRepository } from './BaseRepository';

const countryConverter: FirestoreDataConverter<Country> = {
  toFirestore: (country: Country) => {
    return { ...country };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as Country;
  }
};

class CountryRepository extends BaseRepository<Country> {
  constructor() {
    super('countries', countryConverter);
  }

  async getAllCountries(): Promise<Country[]> {
    try {
      const countries = await super.getAll();
      if (countries.length) {
        const byCode = new Map<string, Country>();
        for (const c of countries) if (c.code) byCode.set(c.code.toUpperCase(), c);
        // Keep the complete country selector available even if Firestore has
        // only a partially seeded countries collection.
        for (const c of FALLBACK_COUNTRIES) {
          if (!byCode.has(c.code)) {
            byCode.set(c.code, {
              id: c.code, uid: c.code, name: c.name, code: c.code,
              currency: '', currencySymbol: '', phoneNumberFormat: '',
              phoneCode: '', addressFormat: '', postalCodeRules: '',
              states: c.code === 'NG' ? Object.keys(NIGERIA_STATES) : [],
              cities: c.code === 'NG' ? Object.values(NIGERIA_STATES).flat() : [],
              supportedLanguages: [], timeZone: '', weightUnits: 'kg',
              measurementUnits: 'metric', dateFormat: 'YYYY-MM-DD',
              consumerProtectionRules: '', defaultPaymentProvider: '',
              defaultMapRegion: { lat: 0, lng: 0, zoom: 1 }, active: true,
              createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString()
            } as unknown as Country);
          }
        }
        return Array.from(byCode.values()).sort((a,b) => a.name.localeCompare(b.name));
      }
    } catch (error) {
      console.warn('Country collection unavailable; using bundled country list.', error);
    }
    return FALLBACK_COUNTRIES.map(c => ({
      id: c.code,
      uid: c.code,
      name: c.name,
      code: c.code,
      currency: '',
      currencySymbol: '',
      phoneNumberFormat: '',
      phoneCode: '',
      addressFormat: '',
      postalCodeRules: '',
      states: c.code === 'NG' ? Object.keys(NIGERIA_STATES) : [],
      cities: c.code === 'NG' ? Object.values(NIGERIA_STATES).flat() : [],
      supportedLanguages: [],
      timeZone: '',
      weightUnits: 'kg',
      measurementUnits: 'metric',
      dateFormat: 'YYYY-MM-DD',
      consumerProtectionRules: '',
      defaultPaymentProvider: '',
      defaultMapRegion: { lat: 0, lng: 0, zoom: 1 },
      active: true,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString()
    } as unknown as Country));
  }

  async getActiveCountries(): Promise<Country[]> {
    try {
      const countries = await this.getAllCountries();
      const active = countries.filter(c => (c as any).active !== false && (c as any).isDeleted !== true);
      return active;
    } catch (error) {
      console.warn('Country collection unavailable; using bundled country list.', error);
    }
    return this.getAllCountries();
  }

  subscribeToCountries(callback: (countries: Country[]) => void) {
    return this.subscribeToQuery([], callback);
  }
}

export const countryRepository = new CountryRepository();
