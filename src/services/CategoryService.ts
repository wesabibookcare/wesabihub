import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

export interface DisputeCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_CATEGORIES: DisputeCategory[] = [
  { id: 'item_not_as_described', name: 'Item Not As Described', description: 'Specifications or features mismatch', isActive: true, createdAt: new Date().toISOString() },
  { id: 'damaged_item', name: 'Damaged Item', description: 'Physical damage to item', isActive: true, createdAt: new Date().toISOString() },
  { id: 'missing_item', name: 'Missing Item', description: 'Items missing from the shipment', isActive: true, createdAt: new Date().toISOString() },
  { id: 'wrong_item', name: 'Wrong Item', description: 'Incorrect item shipped entirely', isActive: true, createdAt: new Date().toISOString() },
  { id: 'counterfeit_item', name: 'Counterfeit Item', description: 'Suspected fake or imitation goods', isActive: true, createdAt: new Date().toISOString() },
  { id: 'delivery_issue', name: 'Delivery Issue', description: 'Late delivery, undelivered, or wrong point delivery', isActive: true, createdAt: new Date().toISOString() },
  { id: 'parcel_tampered', name: 'Parcel Tampered', description: 'Tampering or opening evidence on parcel', isActive: true, createdAt: new Date().toISOString() },
  { id: 'payment_issue', name: 'Payment Issue', description: 'Pricing disputes or checkout SafePay problems', isActive: true, createdAt: new Date().toISOString() },
  { id: 'fraud', name: 'Fraud', description: 'Explicit fraud or scam attempts', isActive: true, createdAt: new Date().toISOString() },
  { id: 'other', name: 'Other', description: 'Any other issues not covered above', isActive: true, createdAt: new Date().toISOString() }
];

export class CategoryService {
  async getCategories(): Promise<DisputeCategory[]> {
    try {
      const snap = await getDocs(collection(db, 'disputeCategories'));
      if (snap.empty) {
        // Seed default categories
        for (const cat of DEFAULT_CATEGORIES) {
          await setDoc(doc(db, 'disputeCategories', cat.id), cat);
        }
        return DEFAULT_CATEGORIES;
      }
      return snap.docs.map(doc => doc.data() as DisputeCategory);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
      return DEFAULT_CATEGORIES;
    }
  }

  async saveCategory(category: DisputeCategory): Promise<void> {
    await setDoc(doc(db, 'disputeCategories', category.id), category);
  }

  async updateCategory(id: string, updates: Partial<DisputeCategory>): Promise<void> {
    await updateDoc(doc(db, 'disputeCategories', id), updates);
  }
}

export const categoryService = new CategoryService();
