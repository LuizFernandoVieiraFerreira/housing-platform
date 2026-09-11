import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { errorResponse, handleOptions, jsonResponse } from '../_shared/http.ts';
import { captureException } from '../_shared/logger.ts';
import { createEmbedding, embeddingToVectorLiteral, sha256Hex } from '../_shared/openai.ts';
import { enforceRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { createServiceClient, getServiceRoleKey } from '../_shared/supabase.ts';

interface SyncPropertyEmbeddingBody {
  propertyId?: string;
  allPublished?: boolean;
}

interface SyncResult {
  propertyId: string;
  status: 'synced' | 'skipped' | 'failed';
  reason?: string;
}

async function updatePropertyEmbeddingSyncStatus(
  propertyId: string,
  patch: {
    status: 'synced' | 'failed' | 'not_applicable';
    error?: string | null;
    incrementAttempts?: boolean;
  },
): Promise<void> {
  const serviceClient = createServiceClient();

  const { data: existing, error: existingError } = await serviceClient
    .from('properties')
    .select('embedding_sync_attempts')
    .eq('id', propertyId)
    .maybeSingle();

  if (existingError) {
    console.error('Unable to load embedding sync status', existingError.message);
    return;
  }

  const attempts = patch.incrementAttempts
    ? (existing?.embedding_sync_attempts ?? 0) + 1
    : patch.status === 'synced'
      ? 0
      : (existing?.embedding_sync_attempts ?? 0);

  const { error } = await serviceClient
    .from('properties')
    .update({
      embedding_sync_status: patch.status,
      embedding_sync_error: patch.error ?? null,
      embedding_synced_at:
        patch.status === 'synced' ? new Date().toISOString() : undefined,
      embedding_sync_attempts: attempts,
    })
    .eq('id', propertyId);

  if (error) {
    console.error('Unable to update embedding sync status', error.message);
  }
}

function isServiceRoleRequest(req: Request): boolean {
  const serviceRoleKey = getServiceRoleKey();

  if (!serviceRoleKey) {
    return false;
  }

  const authorization = req.headers.get('Authorization') ?? '';
  const apiKey = req.headers.get('apikey') ?? '';

  return authorization === `Bearer ${serviceRoleKey}` || apiKey === serviceRoleKey;
}

async function syncPropertyEmbedding(propertyId: string): Promise<SyncResult> {
  const serviceClient = createServiceClient();

  const { data: property, error: propertyError } = await serviceClient
    .from('properties')
    .select('id, status, deleted_at')
    .eq('id', propertyId)
    .maybeSingle();

  if (propertyError) {
    await updatePropertyEmbeddingSyncStatus(propertyId, {
      status: 'failed',
      error: propertyError.message,
      incrementAttempts: true,
    });

    return {
      propertyId,
      status: 'failed',
      reason: propertyError.message,
    };
  }

  if (!property || property.deleted_at != null || property.status !== 'published') {
    await serviceClient.from('property_search_embeddings').delete().eq('property_id', propertyId);
    await updatePropertyEmbeddingSyncStatus(propertyId, {
      status: 'not_applicable',
      error: null,
    });

    return {
      propertyId,
      status: 'skipped',
      reason: 'Property is not published',
    };
  }

  const { data: content, error: documentError } = await serviceClient.rpc(
    'build_property_search_document',
    { p_property_id: propertyId },
  );

  if (documentError || typeof content !== 'string' || !content.trim()) {
    await updatePropertyEmbeddingSyncStatus(propertyId, {
      status: 'failed',
      error: documentError?.message ?? 'Unable to build search document',
      incrementAttempts: true,
    });

    return {
      propertyId,
      status: 'failed',
      reason: documentError?.message ?? 'Unable to build search document',
    };
  }

  const contentHash = await sha256Hex(content);

  const { data: existing, error: existingError } = await serviceClient
    .from('property_search_embeddings')
    .select('content_hash')
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existingError) {
    await updatePropertyEmbeddingSyncStatus(propertyId, {
      status: 'failed',
      error: existingError.message,
      incrementAttempts: true,
    });

    return {
      propertyId,
      status: 'failed',
      reason: existingError.message,
    };
  }

  if (existing?.content_hash === contentHash) {
    await updatePropertyEmbeddingSyncStatus(propertyId, {
      status: 'synced',
      error: null,
    });

    return {
      propertyId,
      status: 'skipped',
      reason: 'Embedding already up to date',
    };
  }

  const embeddingValues = await createEmbedding(content);

  const { error: upsertError } = await serviceClient.from('property_search_embeddings').upsert({
    property_id: propertyId,
    content,
    content_hash: contentHash,
    embedding: embeddingToVectorLiteral(embeddingValues),
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    await updatePropertyEmbeddingSyncStatus(propertyId, {
      status: 'failed',
      error: upsertError.message,
      incrementAttempts: true,
    });

    return {
      propertyId,
      status: 'failed',
      reason: upsertError.message,
    };
  }

  await updatePropertyEmbeddingSyncStatus(propertyId, {
    status: 'synced',
    error: null,
  });

  return {
    propertyId,
    status: 'synced',
  };
}

serve(async (req) => {
  const optionsResponse = handleOptions(req);

  if (optionsResponse) {
    return optionsResponse;
  }

  const rateLimit = enforceRateLimit(req, {
    bucket: 'sync-property-embedding',
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterMs);
  }

  if (req.method !== 'POST') {
    return errorResponse('VALIDATION_ERROR', 'Method not allowed', 405);
  }

  if (!isServiceRoleRequest(req)) {
    return errorResponse('UNAUTHORIZED', 'Service role authorization required', 401);
  }

  try {
    const body = (await req.json()) as SyncPropertyEmbeddingBody;
    const serviceClient = createServiceClient();
    let propertyIds: string[] = [];

    if (body.allPublished) {
      const { data, error } = await serviceClient
        .from('properties')
        .select('id')
        .eq('status', 'published')
        .is('deleted_at', null);

      if (error) {
        return errorResponse('INTERNAL_ERROR', 'Unable to load published properties', 500);
      }

      propertyIds = (data ?? []).map((row) => row.id as string);
    } else if (body.propertyId?.trim()) {
      propertyIds = [body.propertyId.trim()];
    } else {
      return errorResponse(
        'VALIDATION_ERROR',
        'Provide propertyId or set allPublished to true',
        400,
      );
    }

    const results: SyncResult[] = [];

    for (const propertyId of propertyIds) {
      try {
        results.push(await syncPropertyEmbedding(propertyId));
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown sync error';

        await updatePropertyEmbeddingSyncStatus(propertyId, {
          status: 'failed',
          error: reason,
          incrementAttempts: true,
        });

        results.push({
          propertyId,
          status: 'failed',
          reason,
        });
      }
    }

    const summary = results.reduce(
      (counts, result) => {
        counts[result.status] += 1;
        return counts;
      },
      { synced: 0, skipped: 0, failed: 0 },
    );

    return jsonResponse({
      summary,
      results,
    });
  } catch (error) {
    await captureException(error, { function: 'sync-property-embedding' });
    return errorResponse('INTERNAL_ERROR', 'Unable to sync property embeddings', 500);
  }
});
