import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), '../prisma/schema.prisma');
let schema = readFileSync(schemaPath, 'utf8');

schema = schema.replace(
  /schemas\s*=\s*\[[^\]]+\]/,
  'schemas  = ["public", "auth"]',
);

writeFileSync(schemaPath, schema);
console.log('Prepared prisma/schema.prisma for introspection (added auth schema).');
