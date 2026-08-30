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
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    const users = await this.getAll([where('email', '==', clean), where('status', '!=', 'BLOCKED')]);
    if (users.length > 0) return users[0];

    // Fallback: search all users case-insensitively
    const allUsers = await this.getAll([]);
    return allUsers.find(u => u.email?.trim().toLowerCase() === clean && u.status !== 'BLOCKED') || null;
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
      if (!u.wesabiUsername && !u.displayName) return false;
      const uName = (u.wesabiUsername || u.displayName || '').toLowerCase();
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
    if (!phone) return null;
    const clean = phone.trim();
    const digitsOnly = clean.replace(/\D/g, '');

    const users = await this.getAll([where('phoneNumber', '==', clean)]);
    if (users.length > 0) return users[0];
    const users2 = await this.getAll([where('phone', '==', clean)]);
    if (users2.length > 0) return users2[0];

    if (digitsOnly) {
      const allUsers = await this.getAll([]);
      return allUsers.find(u => {
        const uDigits = (u.phoneNumber || u.phone || '').replace(/\D/g, '');
        return uDigits && (uDigits === digitsOnly || uDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uDigits));
      }) || null;
    }
    return null;
  }

  async searchUser(searchTerm: string): Promise<User | null> {
    if (!searchTerm || !searchTerm.trim()) return null;
    const clean = searchTerm.trim();
    const lowerClean = clean.toLowerCase().replace(/^@/, '');
    const numericOnly = clean.replace(/\D/g, '');

    // 1. Direct exact lookups
    const byId = await this.getById(clean);
    if (byId) return byId;

    const byEmail = await this.getByEmail(clean);
    if (byEmail) return byEmail;

    const byUsername = await this.getByUsername(clean);
    if (byUsername) return byUsername;

    const byPhone = await this.getByPhone(clean);
    if (byPhone) return byPhone;

    // 2. Comprehensive search across all users
    const allUsers = await this.getAllUsers();
    return allUsers.find(u => {
      if (!u) return false;
      const uEmail = (u.email || '').toLowerCase();
      const uUsername = (u.wesabiUsername || '').toLowerCase().replace(/^@/, '').replace(/^wsh_/, '').replace(/^wesabi/, '');
      const uName = (u.displayName || '').toLowerCase();
      const uPhone = (u.phoneNumber || u.phone || '').replace(/\D/g, '');

      return (
        uEmail === lowerClean ||
        (lowerClean.length >= 3 && uEmail.includes(lowerClean)) ||
        uUsername === lowerClean ||
        (lowerClean.length >= 3 && uUsername.includes(lowerClean)) ||
        uName === lowerClean ||
        (lowerClean.length >= 3 && uName.includes(lowerClean)) ||
        (numericOnly.length >= 7 && uPhone.includes(numericOnly))
      );
    }) || null;
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
