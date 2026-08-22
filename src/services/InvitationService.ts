import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserRole } from '../types';

export interface Invitation {
  id: string;
  code: string;
  senderId: string; // Logistics Company Owner
  role: UserRole; // FLEET_MANAGER or DRIVER
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  createdAt: any;
  acceptedBy?: string; // User ID who used the code
}

class InvitationService {
  private static instance: InvitationService;

  private constructor() {}

  public static getInstance(): InvitationService {
    if (!InvitationService.instance) {
      InvitationService.instance = new InvitationService();
    }
    return InvitationService.instance;
  }

  // Generate a 6-digit alphanumeric code
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createInvitation(senderId: string, role: UserRole): Promise<Invitation> {
    const code = this.generateCode();
    const id = `INV-${Date.now()}-${code}`;

    const invitation: Invitation = {
      id,
      code,
      senderId,
      role,
      status: 'PENDING',
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'invitations', id), invitation);
    return invitation;
  }

  async validateCode(code: string, role: UserRole): Promise<Invitation | null> {
    const q = query(
      collection(db, 'invitations'),
      where('code', '==', code.toUpperCase()),
      where('role', '==', role),
      where('status', '==', 'PENDING')
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data() as Invitation;
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    const invRef = doc(db, 'invitations', invitationId);
    await updateDoc(invRef, {
      status: 'ACCEPTED',
      acceptedBy: userId,
      acceptedAt: serverTimestamp()
    });
  }
}

export const invitationService = InvitationService.getInstance();
