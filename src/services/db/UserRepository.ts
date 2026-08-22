import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { User } from '../../types';
import { BaseRepository } from './BaseRepository';

const userConverter: FirestoreDataConverter<User> = {
  toFirestore: (user: User) => {
    return JSON.parse(JSON.stringify(user));
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id,
      uid: snapshot.id
    } as User;
  }
};

class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users', userConverter);
  }

  async getByEmail(email: string): Promise<User | null> {
    const users = await this.getAll([where('email', '==', email), where('status', '!=', 'BLOCKED')]);
    return users.length > 0 ? users[0] : null;
  }

  async getByUsername(username: string): Promise<User | null> {
    if (!username) return null;
    const clean = username.trim();
    const users = await this.getAll([where('wesabiUsername', '==', clean)]);
    if (users.length > 0) return users[0];

    // Fallback: fetch all users and match case-insensitively with various prefix formats
    const allUsers = await this.getAll([]);
    const lowerClean = clean.toLowerCase().replace(/^@/, '');

    const matched = allUsers.find(u => {
      if (!u.wesabiUsername) return false;
      const uName = u.wesabiUsername.toLowerCase();
      const cleanUName = uName.replace(/^@/, '').replace(/^wsh_/, '').replace(/^wesabi/, '');
      return uName === lowerClean ||
             uName === `@${lowerClean}` ||
             uName === `wsh_${lowerClean}` ||
             uName === `@wesabi${lowerClean}` ||
             cleanUName === lowerClean;
    });

    return matched || null;
  }

  async getByPhone(phone: string): Promise<User | null> {
    const users = await this.getAll([where('phoneNumber', '==', phone)]);
    if (users.length > 0) return users[0];
    const users2 = await this.getAll([where('phone', '==', phone)]);
    return users2.length > 0 ? users2[0] : null;
  }

  async getByRole(role: string): Promise<User[]> {
    return this.getAll([where('roles', 'array-contains', role)]);
  }

  async getByHub(hubId: string): Promise<User[]> {
    return this.getAll([where('hubId', '==', hubId)]);
  }

  async getAllUsers(): Promise<User[]> {
    return this.getAll([]);
  }

  async updatePreferences(userId: string, preferences: Partial<User['preferences']>): Promise<void> {
    const user = await this.getById(userId);
    if (!user) return;

    await this.update(userId, {
      preferences: {
        ...(user.preferences || {}),
        ...preferences
      }
    });
  }
}

export const userRepository = new UserRepository();
