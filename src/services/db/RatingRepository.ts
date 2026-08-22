import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { RatingReview, RatingStatus } from '../../types';
import { BaseRepository } from './BaseRepository';

const ratingConverter: FirestoreDataConverter<RatingReview> = {
  toFirestore: (rating: RatingReview) => {
    return JSON.parse(JSON.stringify(rating));
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as RatingReview;
  }
};

class RatingRepository extends BaseRepository<RatingReview> {
  constructor() {
    super('wesabiRatings', ratingConverter);
  }

  /**
   * Get all published ratings for a specific target entity
   */
  async getRatingsForTarget(targetId: string, status: RatingStatus = 'PUBLISHED', limitCount: number = 50): Promise<RatingReview[]> {
    return this.getAll([
      where('targetId', '==', targetId),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  }

  /**
   * Get rating submitted by author for a specific parcel interaction
   */
  async getRatingByAuthorAndParcel(authorId: string, parcelId: string): Promise<RatingReview | null> {
    const results = await this.getAll([
      where('authorId', '==', authorId),
      where('parcelId', '==', parcelId),
      limit(1)
    ]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get all ratings written by an author
   */
  async getRatingsByAuthor(authorId: string, limitCount: number = 50): Promise<RatingReview[]> {
    return this.getAll([
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  }

  /**
   * Get all reported ratings requiring admin moderation
   */
  async getReportedRatings(limitCount: number = 100): Promise<RatingReview[]> {
    return this.getAll([
      where('status', '==', 'REPORTED'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  }

  /**
   * Get all platform ratings for moderation
   */
  async getAllRatingsForAdmin(limitCount: number = 200): Promise<RatingReview[]> {
    return this.getAll([
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  }

  /**
   * Realtime listener for target entity ratings
   */
  subscribeToTargetRatings(targetId: string, callback: (ratings: RatingReview[]) => void) {
    return this.subscribeToQuery([
      where('targetId', '==', targetId),
      where('status', '==', 'PUBLISHED'),
      orderBy('createdAt', 'desc'),
      limit(50)
    ], callback);
  }
}

export const ratingRepository = new RatingRepository();
