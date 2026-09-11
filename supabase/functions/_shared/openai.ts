const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const OPENAI_CHAT_MODEL = 'gpt-4o-mini';
const OPENAI_EMBEDDING_DIMENSIONS = 1536;

export interface LlmExtractedSearchIntent {
  property_type: 'share-house' | 'studio' | 'micro-studio' | 'multi-bedroom' | null;
  price_min: number | null;
  price_max: number | null;
  check_in: string | null;
  check_out: string | null;
  stay_months: number | null;
  guests: number | null;
  amenity_slugs: string[];
  max_station_walk_min: number | null;
  location_phrase: string | null;
  district: string | null;
  sort: 'recommended' | 'price_asc' | 'price_desc' | 'distance' | 'semantic' | null;
  semantic_query: string | null;
  cheaper_than_reference: boolean;
}

function getOpenAiApiKey(): string {
  return Deno.env.get('OPENAI_API_KEY')?.trim() ?? '';
}

export function isOpenAiConfigured(): boolean {
  return getOpenAiApiKey().length > 0;
}

export async function createEmbedding(input: string): Promise<number[]> {
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const normalizedInput = input.trim();

  if (!normalizedInput) {
    throw new Error('Embedding input must not be empty');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: normalizedInput,
      dimensions: OPENAI_EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI embedding request failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const embedding = payload.data?.[0]?.embedding;

  if (!embedding || embedding.length !== OPENAI_EMBEDDING_DIMENSIONS) {
    throw new Error('OpenAI returned an invalid embedding payload');
  }

  return embedding;
}

export function embeddingToVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getOpenAiChatModel(): string {
  return Deno.env.get('OPENAI_CHAT_MODEL')?.trim() || OPENAI_CHAT_MODEL;
}

export async function extractSearchIntentUsingLlm(
  query: string,
): Promise<LlmExtractedSearchIntent> {
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getOpenAiChatModel(),
      temperature: 0,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'property_search_intent',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              property_type: {
                type: ['string', 'null'],
                enum: ['share-house', 'studio', 'micro-studio', 'multi-bedroom', null],
              },
              price_min: { type: ['number', 'null'] },
              price_max: { type: ['number', 'null'] },
              check_in: { type: ['string', 'null'] },
              check_out: { type: ['string', 'null'] },
              stay_months: { type: ['number', 'null'] },
              guests: { type: ['number', 'null'] },
              amenity_slugs: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: [
                    'wifi',
                    'desk',
                    'air-conditioning',
                    'washing-machine',
                    'kitchen',
                    'elevator',
                    'parking',
                    'balcony',
                    'heating',
                  ],
                },
              },
              max_station_walk_min: { type: ['number', 'null'] },
              location_phrase: { type: ['string', 'null'] },
              district: { type: ['string', 'null'] },
              sort: {
                type: ['string', 'null'],
                enum: ['recommended', 'price_asc', 'price_desc', 'distance', 'semantic', null],
              },
              semantic_query: { type: ['string', 'null'] },
              cheaper_than_reference: { type: 'boolean' },
            },
            required: [
              'property_type',
              'price_min',
              'price_max',
              'check_in',
              'check_out',
              'stay_months',
              'guests',
              'amenity_slugs',
              'max_station_walk_min',
              'location_phrase',
              'district',
              'sort',
              'semantic_query',
              'cheaper_than_reference',
            ],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'Extract structured property search filters from the user query for monthly stays in Seoul, South Korea. Use KRW monthly rent. Put soft lifestyle preferences only in semantic_query. Use amenity_slugs only for explicit amenities. Return null for unknown structured fields.',
        },
        {
          role: 'user',
          content: query.trim(),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI chat request failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned an empty intent payload');
  }

  return JSON.parse(content) as LlmExtractedSearchIntent;
}
