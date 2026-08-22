import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { UserCourseProgress } from '../../types';
import { BaseRepository } from './BaseRepository';

const userCourseProgressConverter: FirestoreDataConverter<UserCourseProgress> = {
  toFirestore: (data: UserCourseProgress) => ({ ...data }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  } as UserCourseProgress)
};

class UserCourseProgressRepository extends BaseRepository<UserCourseProgress> {
  constructor() {
    super('userCourseProgress', userCourseProgressConverter);
  }
}

export const userCourseProgressRepository = new UserCourseProgressRepository();
