import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { createMemberHash } from '../_shared/channel.ts';
import { errorResponse, handleOptions, jsonResponse } from '../_shared/http.ts';
import { captureException } from '../_shared/logger.ts';
import { enforceRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { createServiceClient, getAuthenticatedUser } from '../_shared/supabase.ts';

serve(async (req) => {
  const optionsResponse = handleOptions(req);

  if (optionsResponse) {
    return optionsResponse;
  }

  const rateLimit = enforceRateLimit(req, {
    bucket: 'channel-boot',
    limit: 60,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterMs);
  }

  if (req.method !== 'GET') {
    return errorResponse('VALIDATION_ERROR', 'Method not allowed', 405);
  }

  try {
  const pluginKey = Deno.env.get('CHANNEL_PLUGIN_KEY')?.trim() ?? '';
  const channelSecret = Deno.env.get('CHANNEL_SECRET')?.trim() ?? '';
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return jsonResponse({
      pluginKey: pluginKey || null,
      anonymous: true,
    });
  }

  const serviceClient = createServiceClient();
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return errorResponse('INTERNAL_ERROR', 'Profile not found', 500);
  }

  const { data: bookings, error: bookingsError } = await serviceClient
    .from('bookings')
    .select('id')
    .eq('customer_id', user.id)
    .not('status', 'in', '("cancelled","rejected","expired")')
    .order('created_at', { ascending: false })
    .limit(10);

  if (bookingsError) {
    return errorResponse('INTERNAL_ERROR', 'Unable to load bookings', 500);
  }

  const bookingIds = (bookings ?? []).map((booking) => booking.id as string);
  const response: Record<string, unknown> = {
    pluginKey: pluginKey || null,
    memberId: profile.id,
    profile: {
      name: profile.full_name,
      email: user.email ?? '',
      role: profile.role,
      bookingIds,
    },
  };

  if (channelSecret) {
    try {
      response.memberHash = await createMemberHash(profile.id, channelSecret);
    } catch {
      return errorResponse('INTERNAL_ERROR', 'Unable to create member hash', 500);
    }
  }

  return jsonResponse(response);
  } catch (error) {
    await captureException(error, { function: 'channel-boot' });
    return errorResponse('INTERNAL_ERROR', 'Unable to boot Channel.io', 500);
  }
});
