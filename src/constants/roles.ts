import { UserRole } from '../types';

export const ROLES: Record<UserRole, { label: string; level: number }> = {
  user: { label: 'Perakende', level: 1 },
  wholesale: { label: 'Toptan', level: 2 },
  admin: { label: 'Admin', level: 3 },
};

export const ROLE_HIERARCHY: UserRole[] = ['user', 'wholesale', 'admin'];

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}
