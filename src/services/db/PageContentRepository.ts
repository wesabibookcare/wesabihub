import { BaseRepository } from './BaseRepository';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';

export interface PageContent {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

const pageContentConverter: FirestoreDataConverter<PageContent> = {
  toFirestore: (data: PageContent) => ({ ...data }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  } as PageContent)
};

class PageContentRepository extends BaseRepository<PageContent> {
  constructor() {
    super('page_content', pageContentConverter);
  }

  async getPageContent(pageId: string): Promise<PageContent | null> {
    const docRef = doc(db, 'page_content', pageId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PageContent;
    }
    return null;
  }

  async updatePageContent(pageId: string, data: Partial<PageContent>): Promise<void> {
    const docRef = doc(db, 'page_content', pageId);
    await setDoc(docRef, { ...data, id: pageId }, { merge: true });
  }
}

export const pageContentRepository = new PageContentRepository();
