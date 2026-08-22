import { BaseRepository } from './BaseRepository';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

const converter: FirestoreDataConverter<FAQ> = {
  toFirestore: (data: FAQ) => data,
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    return { id: snapshot.id, ...snapshot.data(options) } as FAQ;
  }
};

export class FAQRepository extends BaseRepository<FAQ> {
  constructor() {
    super('faqs', converter);
  }
}

export const faqRepository = new FAQRepository();
