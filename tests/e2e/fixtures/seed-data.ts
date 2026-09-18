/** Shared password for seeded dev accounts (see supabase/seed.sql). */
export const SEED_PASSWORD = '1234qwer';

export const USERS = {
  customer: 'luizfernandovieiraferreira@gmail.com',
  host: 'host@gmail.com',
  host2: 'host2@gmail.com',
  admin: 'admin@gmail.com',
} as const;

export const PROPERTIES = {
  instantBookStudio: {
    id: '44444444-4444-4444-8444-444444444405',
    title: 'Sunny Hongdae studio under 1.2M',
    minStayNights: 30,
  },
  draftStudio: {
    id: '44444444-4444-4444-8444-444444444497',
    title: 'Draft studio in Euljiro',
  },
  pendingReviewStudio: {
    id: '44444444-4444-4444-8444-444444444498',
    title: 'Pending review studio in Mapo',
  },
} as const;
