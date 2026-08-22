import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export const supportService = {
  async sendMessage(conversationId: string, senderId: string, text: string) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      conversationId,
      senderId,
      text,
      createdAt: serverTimestamp(),
    });
  },

  async getMessages(conversationId: string) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
  }
};
