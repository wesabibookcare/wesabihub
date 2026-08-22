import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { CourseCategory } from '../../types';
import { BaseRepository } from './BaseRepository';

const courseCategoryConverter: FirestoreDataConverter<CourseCategory> = {
  toFirestore: (data: CourseCategory) => ({ ...data }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  } as CourseCategory)
};

class CourseCategoryRepository extends BaseRepository<CourseCategory> {
  constructor() {
    super('courseCategories', courseCategoryConverter);
  }
}

export const courseCategoryRepository = new CourseCategoryRepository();
