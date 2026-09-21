import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), '../prisma/schema.prisma');
let schema = readFileSync(schemaPath, 'utf8');

schema = schema.replace(
  /schemas\s*=\s*\[[^\]]+\]/,
  'schemas  = ["public"]',
);

const blocks = schema.split(/(?=^(?:model|enum)\s)/m);
const kept = blocks.filter((block) => {
  const trimmed = block.trim();
  if (!trimmed) {
    return true;
  }
  if (!/^(?:model|enum)\s/.test(trimmed)) {
    return true;
  }
  return !block.includes('@@schema("auth")');
});

schema = kept.join('');

schema = schema.replace(
  /^\s*users\s+users\s+@relation\([^\n]+\n/m,
  '',
);

schema = schema.replace(
  /Unsupported\("geography"\)/g,
  'Unsupported("extensions.geography(Point,4326)")',
);
schema = schema.replace(
  /Unsupported\("vector"\)/g,
  'Unsupported("extensions.vector(1536)")',
);

schema = schema.replace(/\n\s*previewFeatures\s*=\s*\["multiSchema"\]/, '');

const header = `// Introspected from Supabase migrations via \`pnpm prisma:pull\`.
// Do not run prisma migrate — see docs/database-ownership.md.
// Auth schema models are excluded; profiles.id references auth.users as a plain UUID.

`;

if (!schema.includes('Introspected from Supabase migrations')) {
  schema = schema.replace(
    /^(generator client \{)/m,
    `${header}$1`,
  );
}

writeFileSync(schemaPath, schema);
console.log('Post-processed prisma/schema.prisma (removed auth models, fixed Unsupported types).');
