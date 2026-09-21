export interface AppConfiguration {
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  databaseUrl: string;
  supabaseUrl: string;
  supabaseJwtSecret: string;
  supabaseJwtAudience: string;
  tossSecretKey: string;
  paymentDevMock: boolean;
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return ['http://localhost:5173'];
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    return JSON.parse(trimmed) as string[];
  }

  return trimmed
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export default (): AppConfiguration => ({
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: '/api/v1',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  supabaseUrl: process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
  supabaseJwtAudience: process.env.SUPABASE_JWT_AUDIENCE ?? 'authenticated',
  tossSecretKey: process.env.TOSS_SECRET_KEY ?? '',
  paymentDevMock: process.env.PAYMENT_DEV_MOCK === 'true',
});
