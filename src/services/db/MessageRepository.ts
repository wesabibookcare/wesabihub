import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, collection, doc, query, orderBy, onSnapshot, getDocs, setDoc } from 'firebase/firestore';
import { Message } from '../../types';
import { db } from '../../lib/firebase';

const converter: FirestoreDataConverter<Message> = {
  toFirestore: (data: Message) => {
    const { id, ...rest } = data;
    return rest;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    return { id: snapshot.id, ...snapshot.data(options) } as Message;
  }
};

export class MessageRepository {
  private getCollectionRef(conversationId: string) {
    return collection(db, 'conversations', conversationId, 'messages').withConverter(converter);
  }

  async createMessage(conversationId: string, message: Message): Promise<void> {
    const docRef = doc(db, 'conversations', conversationId, 'messages', message.id).withConverter(converter);
    const docData = {
      ...message,
      createdAt: message.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    };
    await setDoc(docRef, docData as Message);
  }

  async getMessage(conversationId: string, messageId: string): Promise<Message | null> {
    const docRef = doc(db, 'conversations', conversationId, 'messages', messageId).withConverter(converter);
    const snap = await import('firebase/firestore').then(m => m.getDoc(docRef));
    return snap.exists() ? snap.data() : null;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const q = query(this.getCollectionRef(conversationId), orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

  async updateMessage(conversationId: string, messageId: string, data: Partial<Message>): Promise<void> {
    const docRef = doc(db, 'conversations', conversationId, 'messages', messageId).withConverter(converter);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  }

  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void) {
    const q = query(this.getCollectionRef(conversationId), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data()));
    });
  }
}

export const messageRepository = new MessageRepository();
