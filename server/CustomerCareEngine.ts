import { getFirestore } from 'firebase-admin/firestore';

export interface Persona {
  id: string;
  name: string;
  gender: 'male' | 'female';
  profilePictureUrl: string;
  greeting: string;
  isAvailable: boolean;
}

export async function seedCustomerCarePersonas(db: any) {
  try {
    const personasColl = db.collection('customerCarePersonas');
    const personasSnap = await personasColl.limit(1).get();

    if (personasSnap.empty) {
      console.log('Seeding default customer care personas...');
      const defaultPersonas: Persona[] = [
        { id: 'ada', name: 'Ada', gender: 'female', profilePictureUrl: '/assets/personas/ada.png', greeting: 'Hello! I am Ada from Customer Care. How can I assist you today?', isAvailable: true },
        { id: 'grace', name: 'Grace', gender: 'female', profilePictureUrl: '/assets/personas/grace.png', greeting: 'Hi there! Grace here. Let me know what you need help with.', isAvailable: true },
        { id: 'zainab', name: 'Zainab', gender: 'female', profilePictureUrl: '/assets/personas/zainab.png', greeting: 'Greetings! Zainab here, ready to assist. What can I do for you?', isAvailable: true },
        { id: 'david', name: 'David', gender: 'male', profilePictureUrl: '/assets/personas/david.png', greeting: 'Hello! David here. How can I help you out?', isAvailable: true },
        { id: 'daniel', name: 'Daniel', gender: 'male', profilePictureUrl: '/assets/personas/daniel.png', greeting: 'Hi! Daniel at your service. What do you need help with today?', isAvailable: true },
      ];
      for (const p of defaultPersonas) {
        await personasColl.doc(p.id).set(p);
      }
    }
  } catch (error) {
    console.error('Error seeding customer care personas:', error);
  }
}
