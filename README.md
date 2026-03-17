# @devvir/openapi-ts-client

Generate TypeScript types, Zod schemas, and typed API clients from any Swagger 2.0 or OpenAPI 3.x spec.

## What it generates

| Output | Tool | Description |
|---|---|---|
| `dist/types.ts` | [openapi-typescript](https://openapi-ts.dev) | TypeScript interfaces for all schemas and operations |
| `dist/schemas.ts` | [orval](https://orval.dev) | Zod validation schemas |
| `dist/client/fetch.ts` | [orval](https://orval.dev) | Native fetch client (zero runtime deps) |
| `dist/client/axios.ts` | [orval](https://orval.dev) | Axios-based client |
| `dist/openapi.json` | [swagger2openapi](https://github.com/Mermade/oas-kit) | Converted OAS 3.0 spec (if input was Swagger 2.0) |

## Setup

```bash
pnpm install
pnpm generate -- <path-to-swagger.json>
pnpm build
```

## Generate

Point it at any Swagger 2.0 or OpenAPI 3.x JSON file:

```bash
npm run generate -- ./swagger.json
```

This produces auto-generated TypeScript source in `src/`, which is then compiled to `dist/` via `npm run build`.

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
