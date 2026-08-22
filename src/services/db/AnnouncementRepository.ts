import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { Announcement } from '../../types';
import { BaseRepository } from './BaseRepository';

const announcementConverter: FirestoreDataConverter<Announcement> = {
  toFirestore: (data: Announcement) => ({ ...data }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => ({
    ...snapshot.data(),
    id: snapshot.id
  } as Announcement)
};

class AnnouncementRepository extends BaseRepository<Announcement> {
  constructor() {
    super('announcements', announcementConverter);
  }
}

export const announcementRepository = new AnnouncementRepository();
