import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ReturnRequest } from '../../types';

export class ReturnRepository {
  private collectionName = 'returnRequests';

  async create(data: Omit<ReturnRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReturnRequest> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const snap = await getDoc(docRef);
    return { id: snap.id, ...snap.data() } as ReturnRequest;
  }

  async getById(id: string): Promise<ReturnRequest | null> {
    const snap = await getDoc(doc(db, this.collectionName, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as ReturnRequest) : null;
  }

  async getByParcel(parcelId: string): Promise<ReturnRequest[]> {
    const q = query(
      collection(db, this.collectionName),
      where('parcelId', '==', parcelId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReturnRequest));
  }

  async getByCustomer(customerId: string): Promise<ReturnRequest[]> {
    const q = query(
      collection(db, this.collectionName),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReturnRequest));
  }

  async getByMerchant(merchantId: string): Promise<ReturnRequest[]> {
    const q = query(
      collection(db, this.collectionName),
      where('merchantId', '==', merchantId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReturnRequest));
  }

  async update(id: string, data: Partial<ReturnRequest>): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  async deleteAll(): Promise<void> {
    const q = query(collection(db, this.collectionName));
    const snap = await getDocs(q);
    const promises = snap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(promises);
  }

  async getAll(): Promise<ReturnRequest[]> {
    const q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReturnRequest));
  }
}

export const returnRepository = new ReturnRepository();
