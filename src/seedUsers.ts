import { userRepository } from './services/db/UserRepository';
import { User } from './types';

export const seedInitialUsers = async () => {
  try {
    const initialUsers: User[] = [
      {
        id: 'usr-super-admin-1',
        uid: 'usr-super-admin-1',
        email: 'wesabibookcare@gmail.com',
        displayName: 'Super Admin',
        wesabiUsername: 'WSH_SUPER_ADMIN',
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN'],
        status: 'ACTIVE',
        verificationStatus: { email: true, phone: true, kyc: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'usr-merchant-1',
        uid: 'usr-merchant-1',
        email: 'merchant@omorfihub.com',
        displayName: 'OmorfiHub Merchant',
        wesabiUsername: 'WSH_MERCHANT',
        role: 'MERCHANT',
        roles: ['MERCHANT'],
        status: 'ACTIVE',
        verificationStatus: { email: true, phone: true, kyc: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'usr-hubowner-1',
        uid: 'usr-hubowner-1',
        email: 'hubowner@omorfihub.com',
        displayName: 'OmorfiHub Hub Owner',
        wesabiUsername: 'WSH_HUB_OWNER',
        role: 'CENTER_OWNER',
        roles: ['CENTER_OWNER'],
        status: 'ACTIVE',
        verificationStatus: { email: true, phone: true, kyc: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const user of initialUsers) {
      try {
        const existingByEmail = await userRepository.getByEmail(user.email);
        if (existingByEmail) {
          continue;
        }
        await userRepository.create(user.id, user);
      } catch (err: any) {
        const errStr = err?.message || String(err);
        if (errStr.includes('permissions') || errStr.includes('permission-denied')) {
          console.log(`Skipped seeding user ${user.id}: user lacks write permissions.`);
          return;
        } else {
          throw err;
        }
      }
    }
  } catch (error: any) {
    const errorStr = error?.message || String(error);
    if (errorStr.includes('permissions') || errorStr.includes('permission-denied')) {
      console.log('Skipped seeding initial users: user lacks write permissions.');
    } else {
      console.error('Failed to seed initial users:', error);
    }
  }
};
