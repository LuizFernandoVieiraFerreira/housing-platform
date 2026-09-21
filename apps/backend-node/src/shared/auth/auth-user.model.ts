export enum UserRole {
  Customer = 'customer',
  Host = 'host',
  Admin = 'admin',
}

export interface AuthUser {
  id: string;
  email: string | null;
  role: UserRole;
}

export function isAdminUser(user: AuthUser): boolean {
  return user.role === UserRole.Admin;
}
