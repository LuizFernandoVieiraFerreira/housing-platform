export type UserRole = 'customer' | 'host' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: string;
  marketing_consent: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdateInput = Pick<
  Profile,
  'full_name' | 'phone' | 'avatar_url' | 'preferred_language' | 'marketing_consent'
>;
