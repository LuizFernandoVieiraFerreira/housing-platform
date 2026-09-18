#!/usr/bin/env node

import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const featuresDir = join(process.cwd(), 'apps/web/src/features');

function listFeatures() {
  return readdirSync(featuresDir).filter((entry) => {
    const path = join(featuresDir, entry);
    return statSync(path).isDirectory() && !entry.startsWith('.');
  });
}

function hasTestFile(dir) {
  return walk(dir).some((file) => file.endsWith('.test.ts') || file.endsWith('.test.tsx'));
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path, files);
      continue;
    }

    files.push(path);
  }

  return files;
}

function listApiModules(featureDir) {
  const apiDir = join(featureDir, 'api');
  if (!existsSync(apiDir)) {
    return [];
  }

  return readdirSync(apiDir).filter(
    (file) => file.endsWith('-api.ts') && !file.endsWith('.test.ts'),
  );
}

const failures = [];

for (const feature of listFeatures()) {
  const featureDir = join(featuresDir, feature);

  if (!hasTestFile(featureDir)) {
    failures.push(`${feature}: missing any *.test.ts(x) file`);
  }

  const modelUtils = join(featureDir, 'model/utils.ts');
  const modelUtilsTest = join(featureDir, 'model/utils.test.ts');

  if (existsSync(modelUtils) && !existsSync(modelUtilsTest)) {
    failures.push(`${feature}: model/utils.ts requires model/utils.test.ts`);
  }

  for (const apiModule of listApiModules(featureDir)) {
    const testFile = apiModule.replace(/\.ts$/, '.test.ts');
    if (!existsSync(join(featureDir, 'api', testFile))) {
      failures.push(`${feature}: api/${apiModule} requires api/${testFile}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Feature test coverage check failed:\n');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`Feature test coverage OK (${listFeatures().length} features).`);
