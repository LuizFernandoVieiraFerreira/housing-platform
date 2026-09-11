import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

export function getSupabaseUrl(): string {
  return Deno.env.get('SUPABASE_URL') ?? '';
}

export function getServiceRoleKey(): string {
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}

export function createServiceClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getAuthenticatedUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  const supabase = createClient(getSupabaseUrl(), Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export function createUserClient(authHeader: string): SupabaseClient {
  return createClient(getSupabaseUrl(), Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
