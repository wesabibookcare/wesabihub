import { hubPointRepository } from './services/db/HubPointRepository';
import { HubCenter } from './types';

export const seedInitialHubs = async () => {
  try {
    const existing = await hubPointRepository.getAll();
    if (existing && existing.length > 0) {
      console.log('Hub points already exist. Skipping seed.');
      return;
    }

    const initialHubs: HubCenter[] = [
      {
        id: 'hub-seed-1',
        name: 'Ikeja Tech Plaza Hub',
        address: '12 Computer Village, Ikeja',
        city: 'Ikeja',
        state: 'Lagos',
        country: 'Nigeria',
        lga: 'Ikeja',
        location: { lat: 6.596, lng: 3.336 },
        gps: { lat: 6.596, lng: 3.336 },
        type: 'OTHER',
        ownerId: 'seed-owner-1',
        isVerified: true,
        status: 'ACTIVE',
        trustScore: 98,
        rating: 4.8,
        reviews: 120,
        operatingHours: '08:00 AM - 06:00 PM',
        contactPhone: '+234 801 111 2222',
        services: ['Drop-off', 'Pick-up', 'Storage', 'Packaging'],
        totalPoints: 520,
        starRating: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: 'hub-seed-2',
        name: 'Lekki Phase 1 PUDO Center',
        address: '45 Admiralty Way, Lekki Phase 1',
        city: 'Lekki',
        state: 'Lagos',
        country: 'Nigeria',
        lga: 'Eti Osa',
        location: { lat: 6.428, lng: 3.421 },
        gps: { lat: 6.428, lng: 3.421 },
        type: 'SUPERMARKET',
        ownerId: 'seed-owner-2',
        isVerified: true,
        status: 'ACTIVE',
        trustScore: 95,
        rating: 4.6,
        reviews: 85,
        operatingHours: '07:00 AM - 09:00 PM',
        contactPhone: '+234 802 222 3333',
        services: ['Drop-off', 'Pick-up', 'Storage'],
        totalPoints: 450,
        starRating: 4,
        createdAt: new Date().toISOString()
      },
      {
        id: 'hub-seed-3',
        name: 'Wuse II Express Point',
        address: '24 Aminu Kano Crescent, Wuse II',
        city: 'Wuse',
        state: 'FCT - Abuja',
        country: 'Nigeria',
        lga: 'Municipal Area Council',
        location: { lat: 9.076, lng: 7.476 },
        gps: { lat: 9.076, lng: 7.476 },
        type: 'PHARMACY',
        ownerId: 'seed-owner-3',
        isVerified: true,
        status: 'ACTIVE',
        trustScore: 92,
        rating: 4.5,
        reviews: 62,
        operatingHours: '24 Hours',
        contactPhone: '+234 803 333 4444',
        services: ['Drop-off', 'Pick-up', '24/7 Access'],
        totalPoints: 380,
        starRating: 4,
        createdAt: new Date().toISOString()
      },
      {
        id: 'hub-seed-4',
        name: 'Port Harcourt GRA Phase II Hub',
        address: '15 Tombia Street, GRA Phase II',
        city: 'Port Harcourt',
        state: 'Rivers',
        country: 'Nigeria',
        lga: 'Port Harcourt',
        location: { lat: 4.815, lng: 7.049 },
        gps: { lat: 4.815, lng: 7.049 },
        type: 'FILLING_STATION',
        ownerId: 'seed-owner-4',
        isVerified: true,
        status: 'ACTIVE',
        trustScore: 90,
        rating: 4.2,
        reviews: 41,
        operatingHours: '06:00 AM - 10:00 PM',
        contactPhone: '+234 804 444 5555',
        services: ['Drop-off', 'Pick-up', 'Parking'],
        totalPoints: 310,
        starRating: 4,
        createdAt: new Date().toISOString()
      },
      {
        id: 'hub-seed-5',
        name: 'Kano Municipal Logistics Hub',
        address: '38 Murtala Muhammed Way',
        city: 'Kano',
        state: 'Kano',
        country: 'Nigeria',
        lga: 'Kano Municipal',
        location: { lat: 12.002, lng: 8.592 },
        gps: { lat: 12.002, lng: 8.592 },
        type: 'OTHER',
        ownerId: 'seed-owner-5',
        isVerified: true,
        status: 'ACTIVE',
        trustScore: 94,
        rating: 4.7,
        reviews: 95,
        operatingHours: '08:00 AM - 06:00 PM',
        contactPhone: '+234 805 555 6666',
        services: ['Drop-off', 'Pick-up', 'Bulk Cargo'],
        totalPoints: 480,
        starRating: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: 'hub-seed-6',
        name: 'Abeokuta Central PUDO',
        address: '5 Oke-Ilewo Street',
        city: 'Abeokuta',
        state: 'Ogun',
        country: 'Nigeria',
        lga: 'Abeokuta South',
        location: { lat: 7.155, lng: 3.345 },
        gps: { lat: 7.155, lng: 3.345 },
        type: 'SUPERMARKET',
        ownerId: 'seed-owner-6',
        isVerified: true,
        status: 'ACTIVE',
        trustScore: 88,
        rating: 4.1,
        reviews: 29,
        operatingHours: '08:00 AM - 08:00 PM',
        contactPhone: '+234 806 666 7777',
        services: ['Drop-off', 'Pick-up'],
        totalPoints: 220,
        starRating: 3,
        createdAt: new Date().toISOString()
      },
      {
        id: 'hub-seed-7',
        name: 'Ibadan Ring Road Point',
        address: '102 Ring Road, near Challenge',
        city: 'Ibadan',
        state: 'Oyo',
        country: 'Nigeria',
        lga: 'Ibadan North',
        location: { lat: 7.377, lng: 3.896 },
        gps: { lat: 7.377, lng: 3.896 },
        type: 'PHARMACY',
        ownerId: 'seed-owner-7',
        isVerified: true,
        status: 'ACTIVE',
        trustScore: 89,
        rating: 4.3,
        reviews: 34,
        operatingHours: '08:00 AM - 09:00 PM',
        contactPhone: '+234 807 777 8888',
        services: ['Drop-off', 'Pick-up', 'Home Delivery Support'],
        totalPoints: 260,
        starRating: 4,
        createdAt: new Date().toISOString()
      }
    ];

    for (const hub of initialHubs) {
      try {
        await hubPointRepository.create(hub.id, hub);
      } catch (err: any) {
        const errStr = err?.message || String(err);
        if (errStr.includes('permissions') || errStr.includes('permission-denied')) {
          console.log(`Skipped seeding hub ${hub.id}: user lacks write permissions.`);
          return; // Stop early if we lack permissions
        } else {
          throw err;
        }
      }
    }
    console.log('Seeded initial hub centers successfully.');
  } catch (error: any) {
    const errorStr = error?.message || String(error);
    if (errorStr.includes('permissions') || errorStr.includes('permission-denied')) {
      console.log('Skipped seeding initial hubs: user lacks write permissions.');
    } else {
      console.error('Failed to seed initial hubs:', error);
    }
  }
};
