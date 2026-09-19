/**
 * Generates optional frontend Zod schemas from the canonical OpenAPI document.
 * OpenAPI remains the contract. Do not hand-edit packages/api-contract/generated.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { jsonSchemaToZod } from 'json-schema-to-zod';
import { parse } from 'yaml';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const openApiPath = path.join(packageRoot, 'openapi.yaml');
const outputPath = path.join(packageRoot, 'generated', 'index.ts');

const SCHEMA_REF_PREFIX = '#/components/schemas/';

function schemaConstName(schemaName) {
  return `${schemaName.charAt(0).toLowerCase()}${schemaName.slice(1)}Schema`;
}

function schemaNameFromRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith(SCHEMA_REF_PREFIX)) {
    return null;
  }

  const name = ref.slice(SCHEMA_REF_PREFIX.length);
  return name.length > 0 && !name.includes('/') ? name : null;
}

function collectSchemaRefs(node, refs = new Set()) {
  if (!node || typeof node !== 'object') {
    return refs;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectSchemaRefs(item, refs);
    }
    return refs;
  }

  const name = schemaNameFromRef(node.$ref);
  if (name) {
    refs.add(name);
  }

  for (const value of Object.values(node)) {
    collectSchemaRefs(value, refs);
  }

  return refs;
}

function sortSchemaNames(schemas) {
  const names = Object.keys(schemas);
  const known = new Set(names);
  const dependencies = new Map(
    names.map((name) => [
      name,
      [...collectSchemaRefs(schemas[name])].filter(
        (dependency) => dependency !== name && known.has(dependency),
      ),
    ]),
  );
  const pending = new Set(names);
  const sorted = [];

  while (pending.size > 0) {
    const ready = [...pending]
      .filter((name) => dependencies.get(name).every((dependency) => !pending.has(dependency)))
      .sort();

    if (ready.length === 0) {
      throw new Error(`Cyclic OpenAPI schema refs: ${[...pending].sort().join(', ')}`);
    }

    for (const name of ready) {
      pending.delete(name);
      sorted.push(name);
    }
  }

  return sorted;
}

function mergeObjectSchemas(schema, schemas, seen) {
  if (!schema || typeof schema !== 'object' || !Array.isArray(schema.allOf)) {
    return schema;
  }

  const properties = {};
  const required = new Set();
  let additionalProperties = true;
  let description = schema.description;

  for (const part of schema.allOf) {
    const resolved = resolveSchema(part, schemas, seen);
    if (!resolved || resolved.type !== 'object') {
      return schema;
    }

    Object.assign(properties, resolved.properties ?? {});
    for (const key of resolved.required ?? []) {
      required.add(key);
    }
    if (resolved.additionalProperties === false) {
      additionalProperties = false;
    }
    description ??= resolved.description;
  }

  return {
    type: 'object',
    additionalProperties,
    required: [...required],
    properties,
    ...(description ? { description } : {}),
  };
}

function resolveSchema(schema, schemas, seen) {
  const name = schemaNameFromRef(schema?.$ref);
  if (name) {
    if (seen.has(name)) {
      throw new Error(`Cyclic schema while merging ${name}`);
    }
    return resolveSchema(schemas[name], schemas, new Set([...seen, name]));
  }

  if (Array.isArray(schema?.allOf)) {
    return mergeObjectSchemas(schema, schemas, seen);
  }

  return schema;
}

function renderSchema(name, schema, schemas) {
  const expression = jsonSchemaToZod(mergeObjectSchemas(schema, schemas, new Set([name])), {
    zodVersion: 3,
    parserOverride: (node) => {
      const refName = schemaNameFromRef(node?.$ref);
      return refName ? schemaConstName(refName) : undefined;
    },
  }).trim();
  const constName = schemaConstName(name);

  return `export const ${constName} = ${expression};\nexport type ${name} = z.infer<typeof ${constName}>;`;
}

export function renderZodModule(spec) {
  const schemas = spec?.components?.schemas;
  if (!schemas || typeof schemas !== 'object') {
    throw new Error('openapi.yaml is missing components.schemas');
  }

  const body = sortSchemaNames(schemas)
    .map((name) => renderSchema(name, schemas[name], schemas))
    .join('\n\n');

  return `/**
 * Generated from openapi.yaml. Do not edit.
 *
 * OpenAPI is the canonical cross-language contract. These Zod schemas are an
 * optional frontend convenience for runtime checks, not a second source of truth.
 *
 * Regenerate with: pnpm --filter @housing-platform/api-contract generate
 */
import { z } from 'zod';

${body}
`;
}

async function formatTypeScript(source) {
  const prettier = await import('prettier');
  const config = (await prettier.resolveConfig(outputPath)) ?? {};

  return prettier.format(source, {
    ...config,
    filepath: outputPath,
  });
}

const spec = parse(readFileSync(openApiPath, 'utf8'));
const formatted = await formatTypeScript(renderZodModule(spec));
const check = process.argv.includes('--check');

if (check) {
  const current = readFileSync(outputPath, 'utf8');
  if (current !== formatted) {
    console.error(
      'generated/index.ts is out of date. Run pnpm --filter @housing-platform/api-contract generate',
    );
    process.exit(1);
  }
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, formatted);
}
