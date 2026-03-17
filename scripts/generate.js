#!/usr/bin/env node
// Pending Review

import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { promisify } from 'node:util';
import s2o from 'swagger2openapi';
import { generate } from 'orval';

const convertObj = promisify(s2o.convertObj);

// Parse args: generate.js <spec> [-o <output-dir>]
const args = process.argv.slice(2);
let swaggerFile;
let outputDir;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') {
    outputDir = args[++i];
  } else if (! swaggerFile) {
    swaggerFile = args[i];
  }
}

if (! swaggerFile) {
  console.error('Usage: openapi-ts-client <swagger-or-openapi-file> [-o <output-dir>]');
  console.error('');
  console.error('Example:');
  console.error('  openapi-ts-client ./swagger.json');
  console.error('  openapi-ts-client ./swagger.json -o ../bitmex-rest/src');
  process.exit(1);
}

const swaggerPath = resolve(swaggerFile);

if (! existsSync(swaggerPath)) {
  console.error(`File not found: ${swaggerPath}`);
  process.exit(1);
}

const pkgDir = resolve(dirname(new URL(import.meta.url).pathname), '..');
const srcDir = outputDir ? resolve(outputDir) : resolve(pkgDir, 'src');
const clientDir = resolve(srcDir, 'client');
const openapiPath = resolve(pkgDir, 'openapi.json');

async function main() {
  mkdirSync(clientDir, { recursive: true });

  // 1. Read the input spec
  const raw = JSON.parse(readFileSync(swaggerPath, 'utf8'));

  // 2. Convert to OpenAPI 3.0 if Swagger 2.0, otherwise use as-is
  let openapiSpec;
  if (raw.swagger && raw.swagger.startsWith('2')) {
    process.stdout.write('Converting Swagger 2.0 → OpenAPI 3.0... ');
    const result = await convertObj(raw, { patch: true, warnOnly: true });
    openapiSpec = result.openapi;
    console.log('done');
  } else if (raw.openapi) {
    openapiSpec = raw;
    console.log('Input is already OpenAPI 3.x — using as-is.');
  } else {
    console.error('Unrecognized spec format. Expected Swagger 2.0 or OpenAPI 3.x.');
    process.exit(1);
  }

  writeFileSync(openapiPath, JSON.stringify(openapiSpec, null, 2));

  // 3. Detect base URL from spec
  const baseUrl = detectBaseUrl(raw, openapiSpec);
  console.log(`Base URL: ${baseUrl || '(none detected, clients will use relative paths)'}`);

  // 4. TypeScript types via openapi-typescript
  process.stdout.write('Generating src/types.ts... ');
  execSync(
    `${resolve(pkgDir, 'node_modules/.bin/openapi-typescript')} ${openapiPath} --output ${resolve(srcDir, 'types.ts')}`,
    { stdio: 'pipe', cwd: pkgDir },
  );
  console.log('done');

  // 5. Zod schemas + clients via orval (programmatic API)
  process.stdout.write('Generating schemas + clients (orval)... ');

  const orvalConfig = {
    schemas: {
      input: { target: openapiPath },
      output: {
        mode: 'single',
        target: resolve(srcDir, 'schemas.ts'),
        client: 'zod',
      },
    },
    fetchClient: {
      input: { target: openapiPath },
      output: {
        mode: 'single',
        target: resolve(clientDir, 'fetch.ts'),
        client: 'fetch',
        ...(baseUrl ? { baseUrl } : {}),
      },
    },
    axiosClient: {
      input: { target: openapiPath },
      output: {
        mode: 'single',
        target: resolve(clientDir, 'axios.ts'),
        client: 'axios',
        ...(baseUrl ? { baseUrl } : {}),
      },
    },
  };

  // orval's generate() accepts a config file path (string) or iterates
  // the config entries when given a string. We pass it as a string that
  // points to a temp config, or call it per-entry with the options object.
  for (const [name, config] of Object.entries(orvalConfig)) {
    try {
      await generate(config, pkgDir);
    } catch (err) {
      console.error(`\nFailed to generate "${name}":`, err.message);
      process.exit(1);
    }
  }

  // Fix orval bugs in generated files
  fixObjectObjectDefaults(resolve(srcDir, 'schemas.ts'));
  fixObjectObjectDefaults(resolve(clientDir, 'fetch.ts'));
  fixObjectObjectDefaults(resolve(clientDir, 'axios.ts'));

  console.log('done');

  // 6. Copy openapi.json into src/ so tsc picks it up (resolveJsonModule)
  cpSync(openapiPath, resolve(srcDir, 'openapi.json'));

  console.log('\nGenerated:');
  console.log('  openapi.json        — OAS 3.0 spec');
  console.log('  src/types.ts        — TypeScript interfaces');
  console.log('  src/schemas.ts      — Zod schemas');
  console.log('  src/client/fetch.ts — Fetch client');
  console.log('  src/client/axios.ts — Axios client');
}

function detectBaseUrl(swagger, openapi) {
  // Try Swagger 2.0 host + basePath (more reliable, has scheme info)
  if (swagger.host) {
    const scheme = swagger.schemes?.[0] || 'https';
    return `${scheme}://${swagger.host}${swagger.basePath || ''}`;
  }
  // Try OAS 3.x servers
  if (openapi.servers?.length) {
    const url = openapi.servers[0].url;
    // OAS 3.0 servers may have protocol-relative URLs
    if (url.startsWith('//')) return `https:${url}`;
    return url;
  }
  return '';
}

function fixObjectObjectDefaults(filePath) {
  if (! existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  let fixed = content;
  // orval bug: complex object defaults are stringified as "[object Object]"
  fixed = fixed.replace(/ = \{[^;]*\[object Object\][^;]*\};/g, ' = {};');
  // orval bug: sparse arrays in defaults produce `{ , , , key: val }`
  fixed = fixed.replace(/ = \{[\s,]*(?:,[\s,]*)*(\w)/g, ' = { $1');
  if (fixed !== content) writeFileSync(filePath, fixed);
}

main().catch((err) => {
  console.error('\nGeneration failed:', err.message);
  process.exit(1);
});

