import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  DocumentData,
  FirestoreDataConverter,
  QueryConstraint,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { BaseEntity } from '../../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected collectionName: string;
  protected converter: FirestoreDataConverter<T>;

  constructor(collectionName: string, converter: FirestoreDataConverter<T>) {
    this.collectionName = collectionName;
    this.converter = converter;
  }

  protected handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    // For read and subscribe operations, log the error but do not throw, to prevent crashing the React app
    if (operationType === OperationType.GET || operationType === OperationType.LIST) {
      return;
    }
    throw new Error(JSON.stringify(errInfo));
  }

  protected getCollection() {
    return collection(db, this.collectionName).withConverter(this.converter);
  }

  protected getDocRef(id: string) {
    return doc(db, this.collectionName, id).withConverter(this.converter);
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(this.getDocRef(id));
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      this.handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
      return null; // Won't be reached
    }
  }

  async create(id: string, data: T): Promise<void> {
    const docData = {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    };
    try {
      await setDoc(this.getDocRef(id), JSON.parse(JSON.stringify(docData)) as T);
    } catch (error) {
      this.handleFirestoreError(error, OperationType.CREATE, `${this.collectionName}/${id}`);
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    try {
      await updateDoc(this.getDocRef(id), JSON.parse(JSON.stringify(updateData)));
    } catch (error) {
      this.handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${id}`);
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { isDeleted: true } as any);
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(id));
    } catch (error) {
      this.handleFirestoreError(error, OperationType.DELETE, `${this.collectionName}/${id}`);
    }
  }

  async deleteAll(): Promise<void> {
    try {
      const querySnapshot = await getDocs(this.getCollection());
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      this.handleFirestoreError(error, OperationType.DELETE, this.collectionName);
    }
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(this.getCollection(), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      this.handleFirestoreError(error, OperationType.LIST, this.collectionName);
      return []; // Won't be reached
    }
  }

  async query(constraints: { field: string; operator: any; value: any }[]): Promise<T[]> {
    const validConstraints = constraints.filter(c => c.value !== undefined && c.value !== null);
    if (validConstraints.length === 0 && constraints.length > 0) {
      return [];
    }
    const queryConstraints = validConstraints.map(c => where(c.field, c.operator, c.value));
    return this.getAll(queryConstraints);
  }

  subscribe(id: string, callback: (data: T | null) => void, errorCallback?: (error: unknown) => void) {
    return onSnapshot(
      this.getDocRef(id),
      (doc) => {
        callback(doc.exists() ? doc.data() : null);
      },
      (error) => {
        try {
          this.handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
        } catch (e) {
          console.warn('Subscription error handled silently:', e);
        }
        if (errorCallback) errorCallback(error);
      }
    );
  }

  subscribeToQuery(constraints: QueryConstraint[], callback: (data: T[]) => void, errorCallback?: (error: unknown) => void) {
    const q = query(this.getCollection(), ...constraints);
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map(doc => doc.data()));
      },
      (error) => {
        try {
          this.handleFirestoreError(error, OperationType.LIST, this.collectionName);
        } catch (e) {
          console.warn('Query subscription error handled silently:', e);
        }
        if (errorCallback) errorCallback(error);
      }
    );
  }

  async paginate(constraints: QueryConstraint[], lastDoc?: any, pageSize: number = 20) {
    try {
      const queryConstraints = [...constraints, limit(pageSize)];
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }
      const q = query(this.getCollection(), ...queryConstraints);
      const snapshot = await getDocs(q);
      return {
        items: snapshot.docs.map(doc => doc.data()),
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error) {
      this.handleFirestoreError(error, OperationType.LIST, this.collectionName);
      return { items: [], lastDoc: null };
    }
  }

  async transaction(fn: (transaction: any) => Promise<void>) {
    await runTransaction(db, fn);
  }

  getBatch() {
    return writeBatch(db);
  }
}
