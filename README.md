# @devvir/openapi-ts-client

Generate TypeScript types, Zod schemas, and typed API clients from any Swagger 2.0 or OpenAPI 3.x spec.

## What it generates

| File | Tool | Description |
|---|---|---|
| `types.ts` | [openapi-typescript](https://openapi-ts.dev) | TypeScript interfaces for all schemas and operations |
| `schemas.ts` | [orval](https://orval.dev) | Zod validation schemas |
| `client/fetch.ts` | [orval](https://orval.dev) | Native fetch client (zero runtime deps) |
| `client/axios.ts` | [orval](https://orval.dev) | Axios-based client |
| `openapi.json` | [swagger2openapi](https://github.com/Mermade/oas-kit) | Converted OAS 3.0 spec (if input was Swagger 2.0) |

All files are generated into the output directory (`src/` by default, or the directory specified with `-o`).

## Setup

```bash
pnpm install
```

## Usage

```bash
pnpm generate -- <spec-file> [-o <output-dir>]
```

### Arguments

| Argument | Required | Description |
|---|---|---|
| `<spec-file>` | Yes | Path to a Swagger 2.0 or OpenAPI 3.x JSON file |

### Options

| Option | Description |
|---|---|
| `-o, --output <dir>` | Output directory for generated files. Defaults to `src/` within the package. |

### Examples

```bash
# Generate into the default src/ directory
pnpm generate -- ./swagger.json

# Generate into an external project
pnpm generate -- ./swagger.json -o ../my-api-client/src
```

The generated files are TypeScript source. To use them, they need to be compiled. If you used the default output directory, `pnpm build` will compile them to `dist/`.

## Consuming the package

```typescript
// TypeScript types
import type { paths, operations, components } from '@devvir/openapi-ts-client/types';

// Zod schemas
import { someResponseSchema } from '@devvir/openapi-ts-client/schemas';

// Fetch client (zero deps)
import { someEndpoint } from '@devvir/openapi-ts-client/client/fetch';

// Axios client (requires axios)
import { someEndpoint } from '@devvir/openapi-ts-client/client/axios';

// Raw OAS 3.0 spec
import spec from '@devvir/openapi-ts-client/openapi';
```
