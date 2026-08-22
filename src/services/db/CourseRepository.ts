import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { Course } from '../../types';
import { BaseRepository } from './BaseRepository';

const courseConverter: FirestoreDataConverter<Course> = {
  toFirestore: (data: Course) => ({ ...data }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  } as Course)
};

class CourseRepository extends BaseRepository<Course> {
  constructor() {
    super('courses', courseConverter);
  }
}

export const courseRepository = new CourseRepository();
