import { BaseRepository } from './BaseRepository';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, DocumentData } from 'firebase/firestore';

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

const converter: FirestoreDataConverter<KnowledgeArticle> = {
  toFirestore: (data: KnowledgeArticle) => data,
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    return { id: snapshot.id, ...snapshot.data(options) } as KnowledgeArticle;
  }
};

export class KnowledgeRepository extends BaseRepository<KnowledgeArticle> {
  constructor() {
    super('knowledgeArticles', converter);
  }
}

export const knowledgeRepository = new KnowledgeRepository();
