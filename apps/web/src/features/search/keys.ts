/**
 * Query keys for the search/properties feature.
 * Colocated with hooks for better maintainability.
 */
export const searchKeys = {
  all: ['properties'] as const,
  featured: () => ['properties', 'featured'] as const,
  search: (filters: Record<string, unknown>) => ['properties', 'search', filters] as const,
  aiSearch: (request: Record<string, unknown> | null) =>
    ['properties', 'ai-search', request] as const,
  detail: (propertyId: string) => ['properties', 'detail', propertyId] as const,
} as const;
