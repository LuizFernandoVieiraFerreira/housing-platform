import type {
  AiPropertySearchRequest,
  AiPropertySearchResponse,
  ApiErrorResponse,
} from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';
import { AppError } from '@/shared/lib/errors';

import type { AiSearchFunctionResponse } from '../model';
import { mapAiSearchResponse } from './mappers';

async function parseFunctionError(error: unknown, fallbackMessage: string): Promise<AppError> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'context' in error &&
    error.context instanceof Response
  ) {
    try {
      const payload = (await error.context.json()) as ApiErrorResponse;
      if (payload.error?.message) {
        return new AppError('API_ERROR', payload.error.message, { cause: error });
      }
    } catch {
      return new AppError('API_ERROR', fallbackMessage, { cause: error });
    }
  }

  return AppError.from(error, 'API_ERROR');
}

export async function aiPropertySearch(
  request: AiPropertySearchRequest,
): Promise<AiPropertySearchResponse> {
  const { data, error } = await supabase.functions.invoke('ai-property-search', {
    body: request,
  });

  if (error) {
    throw await parseFunctionError(error, 'Unable to run smart search.');
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorResponse).error?.message === 'string'
  ) {
    throw new AppError('API_ERROR', (data as ApiErrorResponse).error.message);
  }

  return mapAiSearchResponse(data as AiSearchFunctionResponse);
}
