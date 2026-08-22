import { User, UserRole } from '../types';

export const hasRole = (user: User | null | undefined, role: UserRole): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};
